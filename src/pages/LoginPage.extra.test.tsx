import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

import LoginPage, { type ApiResponse } from './LoginPage'
import * as authService from '../services/authService'
import { getErrorMessage } from '../utils/errorUtils'
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
vi.mock('../utils/errorUtils', () => ({ getErrorMessage: vi.fn() }))
vi.mock('../utils/logger', () => ({ logError: vi.fn() }))

describe('LoginPage – resendVerification et rememberMe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('erreur spécifique quand resendVerificationEmail rejette avec data.code', async () => {
    vi.spyOn(authService, 'loginUser').mockRejectedValue({
      response: { status: 400, data: { code: 'email_not_verified' } },
      isAxiosError: true,
    })
    vi.spyOn(authService, 'resendVerificationEmail').mockRejectedValue({
      response: { status: 400, data: { code: 'some_code' } },
      isAxiosError: true,
    })
    ;(getErrorMessage as Mock).mockReturnValue('Erreur spécifique')

    render(<LoginPage />, { wrapper: MemoryRouter })

    // on déclenche l’état emailNotVerified
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'a@b.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    // lien de renvoi
    await waitFor(() =>
      expect(screen.getByText(/renvoyer le mail/i)).toBeInTheDocument()
    )
    fireEvent.click(screen.getByText(/renvoyer le mail/i))

    // message d’erreur spécifique
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
