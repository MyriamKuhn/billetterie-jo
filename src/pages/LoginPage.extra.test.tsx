import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import LoginPage from './LoginPage'
import * as authService from '../services/authService'
import { logError } from '../utils/logger'

// ————————————————
// 1) Mock partiel de react-i18next
vi.mock('react-i18next', async (importActual) => {
  const actual = (await importActual()) as Record<string, any>
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const dict: Record<string, string> = {
          'login.emailLabel': 'Email',
          'login.passwordLabel': 'Mot de passe',
          'login.loginButton': 'Se connecter',
          'login.loginButtonLoad': 'Connexion',
          'login.emailNotVerifiedHint': 'E-mail non vérifié',
          'login.resendLinkText': 'Renvoyer le mail',
          'login.verificationEmailResent': 'E-mail renvoyé',
          'errors.genericError': 'Une erreur est survenue',
          'errors.networkError': 'Erreur réseau',
          'errors.some_code': 'Erreur spécifique',
          'login.forgotPassword': 'Mot de passe oublié ?',
          'login.noAccount': "Je n’ai pas de compte",
          'login.rememberMe': 'Se souvenir de moi',
          'login.twoFATitle': 'Code 2FA requis',
          'login.twoFACodeLabel': 'Code 2FA',
          'login.verify2FAButton': 'Vérifier le code',
          'login.verify2FALoad':    'Vérifier le code',
          'login.cancelLogin': 'Annuler',
        }
        return dict[key] ?? key
      },
      i18n: { language: 'fr' },
    }),
  }
})

// ————————————————
// 2) Mock des stores Zustand
const mockSetToken = vi.fn()
const mockClearToken = vi.fn()
vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: vi.fn((selector: any) =>
    selector({ setToken: mockSetToken, clearToken: mockClearToken })
  ),
}))

const mockSetGuestCartId = vi.fn()
const mockLoadCart = vi.fn()
vi.mock('../stores/useCartStore', () => ({
  useCartStore: vi.fn((selector: any) =>
    selector({
      guestCartId: 'cart-123',
      setGuestCartId: mockSetGuestCartId,
      loadCart: mockLoadCart,
    })
  ),
}))

// ————————————————
// 3) Mock de useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ————————————————
// 4) Mock errorUtils & logger
vi.mock('../utils/errorUtils', () => ({
  getErrorMessage: (_t: unknown, code?: string) => {
    switch (code) {
      case 'some_code':
          return 'Erreur spécifique'
        case 'network_error':
          return 'Erreur réseau'
        default:
          return 'Une erreur est survenue'
      }
    },
  }))
vi.mock('../utils/logger', () => ({ logError: vi.fn() }))

describe('LoginPage – resendVerification et rememberMe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('erreur spécifique quand resendVerificationEmail rejette avec data.code', async () => {
    // 1️⃣ on force l’erreur email_not_verified pour afficher le lien
    vi.spyOn(authService, 'loginUser').mockRejectedValue({
      response: { status: 400, data: { code: 'email_not_verified' } },
      isAxiosError: true,
    })
    // 2️⃣ on force resendVerificationEmail à rejeter avec code = 'some_code'
    vi.spyOn(authService, 'resendVerificationEmail').mockRejectedValue({
      response: { status: 400, data: { code: 'some_code' } },
      isAxiosError: true,
    })

    render(<LoginPage />, { wrapper: MemoryRouter })

    // on passe par l'étape email_not_verified
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'a@b.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    // on attend le lien de renvoi
    await waitFor(() =>
      expect(screen.getByText(/renvoyer le mail/i)).toBeInTheDocument()
    )

    // on clique, et la rejection avec 'some_code' appelle
    // getErrorMessage(..., 'some_code') → 'Erreur spécifique'
    fireEvent.click(screen.getByText(/renvoyer le mail/i))

    // enfin, l’alert doit contenir 'Erreur spécifique'
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Erreur spécifique')
    )
  })

  it('genericError quand resendVerificationEmail rejette sans code', async () => {
    vi.spyOn(authService, 'loginUser').mockRejectedValue({
      response: { status: 400, data: { code: 'email_not_verified' } },
      isAxiosError: true,
    })
    vi.spyOn(authService, 'resendVerificationEmail').mockRejectedValue({
      response: { status: 500, data: {} },
      isAxiosError: true,
    })

    render(<LoginPage />, { wrapper: MemoryRouter })

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'b@c.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() =>
      expect(screen.getByText(/renvoyer le mail/i)).toBeInTheDocument()
    )
    fireEvent.click(screen.getByText(/renvoyer le mail/i))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/une erreur est survenue/i)
    )
  })

  it('networkError quand resendVerificationEmail lance exception non-Axios', async () => {
    vi.spyOn(authService, 'loginUser').mockRejectedValue({
      response: { status: 400, data: { code: 'email_not_verified' } },
      isAxiosError: true,
    })
    vi.spyOn(authService, 'resendVerificationEmail').mockRejectedValue(new Error('oh no'))

    render(<LoginPage />, { wrapper: MemoryRouter })

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'c@d.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() =>
      expect(screen.getByText(/renvoyer le mail/i)).toBeInTheDocument()
    )
    fireEvent.click(screen.getByText(/renvoyer le mail/i))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/erreur réseau/i)
    )
    expect(logError).toHaveBeenCalledWith(
      'LoginPage:handleResendVerification',
      expect.any(Error)
    )
  })

  it('rememberMe=true passé à loginUser quand on coche la case', async () => {
    const spyLogin = vi.spyOn(authService, 'loginUser').mockResolvedValue({
      message: 'ok',
      token: 'tok',
      user: {
        id: 1,
        firstname: '',
        lastname: '',
        email: '',
        role: 'user',
        twofa_enabled: false,
      },
    } as ApiResponse)

    render(<LoginPage />, { wrapper: MemoryRouter })

    const checkbox = screen.getByRole('checkbox', { name: /se souvenir de moi/i })
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: '1234' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(spyLogin).toHaveBeenCalledWith(
        'user@test.com',
        '1234',
        true,
        '',
        expect.any(String),
        'cart-123'
      )
    })
  })

  it('vérifie les hrefs des liens forgot-password et signup', () => {
    render(<LoginPage />, { wrapper: MemoryRouter })
    expect(
      screen.getByRole('link', { name: /mot de passe oublié/i })
    ).toHaveAttribute('href', '/forgot-password')
    expect(
      screen.getByRole('link', { name: /je n’ai pas de compte/i })
    ).toHaveAttribute('href', '/signup')
  })
})

describe('LoginPage – autres branches non couvertes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche errors.genericError quand loginUser rejette avec AxiosError sans code ni 404', async () => {
    // on simule une erreur 400 sans code
    vi.spyOn(authService, 'loginUser').mockRejectedValue({
      response: { status: 400, data: {} },
      isAxiosError: true,
    })

    render(<LoginPage />, { wrapper: MemoryRouter })

    // soumission
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'u@v.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    // on doit voir le message générique
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/une erreur est survenue/i)
    )
  })

  it('met à jour twoFACode quand on tape dans le champ 2FA', async () => {
    // 1) première étape : on force la 2FA
    vi.spyOn(authService, 'loginUser').mockRejectedValueOnce({
      response: { status: 400, data: { code: 'twofa_required' } },
      isAxiosError: true,
    })
    // 2) on laisse le test s’arrêter là, on ne s’occupe pas du submit 2FA

    render(<LoginPage />, { wrapper: MemoryRouter })

    // remplit l’étape 1
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@doe.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    // on attend que la 2FA s'affiche
    const twoFAInput = await screen.findByLabelText(/code 2fa/i)

    // initialement vide
    expect(twoFAInput).toHaveValue('')

    // on tape un code
    fireEvent.change(twoFAInput, { target: { value: '123456' } })
    expect(twoFAInput).toHaveValue('123456')
  })
})

import * as authHelper from '../utils/authHelper'
import type { ApiResponse } from '../types/apiResponse'

describe('LoginPage – 2FA submission et loading', () => {
  const fakeUser: ApiResponse['user'] = {
    id: 1,
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    role: 'user',
    twofa_enabled: false,
  }
  const successResponse: ApiResponse = {
    message: 'ok',
    token: 'tok',
    user: fakeUser,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('injecte twoFACode, bascule en loading, puis appelle onLoginSuccess', async () => {
    // 1️⃣ loginUser rejette d’abord en forçant la 2FA
    const loginSpy = vi
      .spyOn(authService, 'loginUser')
      .mockRejectedValueOnce({
        response: { status: 400, data: { code: 'twofa_required' } },
        isAxiosError: true,
      })
      // 2️⃣ puis résout avec succès
      .mockResolvedValueOnce(successResponse)

    const onLoginSpy = vi
      .spyOn(authHelper, 'onLoginSuccess')
      .mockResolvedValue()

    render(<LoginPage />, { wrapper: MemoryRouter })

    // Étape 1 : email + mot de passe
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    // On attend que le champ 2FA apparaisse
    const twoFAInput = await screen.findByLabelText(/code 2fa/i)

    // Étape 2 : on renseigne le code
    fireEvent.change(twoFAInput, { target: { value: '654321' } })

    // On clique sur Vérifier → doit passer en état loading
    const verifyBtn = screen.getByRole('button', { name: /vérifier le code/i })
    fireEvent.click(verifyBtn)
    expect(screen.getByRole('button', { name: /vérifier le code…/i })).toBeDisabled()

    // Enfin, onLoginSuccess doit être appelé avec les bons args
    await waitFor(() => {
      // loginUser doit être appelé 2 fois et la seconde fois avec twoFACode
      expect(loginSpy).toHaveBeenCalledTimes(2)
      expect(loginSpy).toHaveBeenLastCalledWith(
        'john@example.com',
        'pwd',
        false,          // rememberMe = false par défaut
        '654321',       // <-- injection de twoFACode
        expect.any(String),
        'cart-123'      // guestCartId depuis le mock
      )

      // onLoginSuccess avec le token, rôle, etc.
      expect(onLoginSpy).toHaveBeenCalledWith(
        'tok',
        'user',
        false,
        mockSetToken,
        mockSetGuestCartId,
        mockLoadCart,
        mockNavigate,
        undefined
      )
    })
  })
});

describe('LoginPage – success branches', () => {
  const fakeUser: ApiResponse['user'] = {
    id: 1,
    firstname: 'A',
    lastname: 'B',
    email: 'a@b.com',
    role: 'user',
    twofa_enabled: false,
  }
  const successResponse: ApiResponse = {
    message: 'OK',
    token: 'tok',
    user: fakeUser,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login réussi sans 2FA passe is2FA=false et entre dans if(data.token && data.user)', async () => {
    // 1) loginUser résout tout de suite
    const loginSpy = vi
      .spyOn(authService, 'loginUser')
      .mockResolvedValueOnce(successResponse)
    const onLoginSpy = vi
      .spyOn(authHelper, 'onLoginSuccess')
      .mockResolvedValue()

    render(<LoginPage />, { wrapper: MemoryRouter })

    // Remplir email + pwd + ckeckbox (laisser remember=false par défaut)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    // onLoginSuccess doit être appelé
    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith(
        'a@b.com',
        'pwd',
        false,
        '',           // is2FA=false → twofa_code=''
        expect.any(String),
        'cart-123'
      )
      expect(onLoginSpy).toHaveBeenCalled()
    })
  })

  it('resendVerificationEmail branch succès (status 200 & data.message)', async () => {
    // 1) loginUser échoue avec email_not_verified
    vi.spyOn(authService, 'loginUser').mockRejectedValue({
      response: { status: 400, data: { code: 'email_not_verified' } },
      isAxiosError: true,
    })
    // 2) resendVerificationEmail résout en succès
    vi.spyOn(authService, 'resendVerificationEmail').mockResolvedValue({
      status: 200,
      data: { message: 'sent' }
    })

    render(<LoginPage />, { wrapper: MemoryRouter })

    // on va jusqu'au lien de renvoi
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'x@y.com' } })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    // on attend l'affichage du lien
    await waitFor(() => screen.getByText(/renvoyer le mail/i))

    // on clique
    fireEvent.click(screen.getByText(/renvoyer le mail/i))

    // et on doit voir le message de succès
    expect(await screen.findByText(/e-mail renvoyé/i)).toBeInTheDocument()
  })

  it('ne déclenche pas le succès quand status=200 mais data.message est manquant', async () => {
    // 1) on simule loginUser() renvoyant email_not_verified pour afficher le lien
    vi.spyOn(authService, 'loginUser').mockRejectedValueOnce({
      response: { status: 400, data: { code: 'email_not_verified' } },
      isAxiosError: true,
    })
    // 2) on simule resendVerificationEmail() avec status=200 mais data.message undefined
    vi.spyOn(authService, 'resendVerificationEmail').mockResolvedValue({
      status: 200,
      data: {} as any,
    })

    render(<LoginPage />, { wrapper: MemoryRouter })

    // on active la branche email_not_verified
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'no-msg@b.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))
    await screen.findByText(/renvoyer le mail/i)

    // on clique sur renvoi
    fireEvent.click(screen.getByText(/renvoyer le mail/i))

    //  ⇒ Ici status===200, mais data.message falsy, donc  
    //     le `if (status===200 && data.message)` est faux : 
    //     pas de message de succès
    await waitFor(() => {
      expect(screen.queryByText(/e-mail renvoyé/i)).toBeNull()
    })

    // et on reste sur le lien de renvoi, ce qui prouve que 
    // on n'est pas entré dans la branche “success”
    expect(screen.getByText(/renvoyer le mail/i)).toBeInTheDocument()
  })
})

describe('LoginPage – handleSubmit sans onLoginSuccess', () => {
  const fakeUser: ApiResponse['user'] = {
    id: 1,
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@doe.com',
    role: 'user',
    twofa_enabled: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ne passe pas dans if(data.token && data.user) quand user est manquant', async () => {
    // token présent mais user undefined
    vi.spyOn(authService, 'loginUser').mockResolvedValueOnce({
      message: 'ok',
      token: 'tok',
      user: undefined,
    } as any)

    const onLoginSpy = vi.spyOn(authHelper, 'onLoginSuccess').mockResolvedValue()

    render(<LoginPage />, { wrapper: MemoryRouter })

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'jane@doe.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    // on attend que loginUser ait fini
    await waitFor(() => {
      // onLoginSuccess NE DOIT PAS avoir été appelé
      expect(onLoginSpy).not.toHaveBeenCalled()
      // le bouton de login est réactivé
      expect(screen.getByRole('button', { name: /se connecter/i })).not.toBeDisabled()
    })
  })

  it('ne passe pas dans if(data.token && data.user) quand token est manquant', async () => {
    // user présent mais token undefined
    vi.spyOn(authService, 'loginUser').mockResolvedValueOnce({
      message: 'ok',
      token: undefined,
      user: fakeUser,
    } as any)

    const onLoginSpy = vi.spyOn(authHelper, 'onLoginSuccess').mockResolvedValue()

    render(<LoginPage />, { wrapper: MemoryRouter })

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'jane@doe.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(onLoginSpy).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: /se connecter/i })).not.toBeDisabled()
    })
  })
})

