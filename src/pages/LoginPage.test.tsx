// src/pages/LoginPage.test.tsx
import { vi } from 'vitest'

// 1️⃣ Mock partiel de react-i18next pour conserver initReactI18next et ajouter useTranslation()
vi.mock('react-i18next', async (importActual) => {
  const actual = (await importActual()) as Record<string, any>
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const dict: Record<string, string> = {
          // labels & buttons
          'login.emailLabel': 'Email',
          'login.passwordLabel': 'Mot de passe',
          'login.showPassword': 'Afficher le mot de passe',
          'login.hidePassword': 'Cacher le mot de passe',
          'login.loginButton': 'Se connecter',
          'login.forgotPassword': 'Mot de passe oublié ?',
          'login.noAccount': 'Je n’ai pas de compte',
          // email verification
          'login.emailNotVerifiedHint': 'E-mail non vérifié',
          'login.resendLinkText': 'Renvoyer le mail',
          'login.verificationEmailResent': 'E-mail renvoyé',
          // 2FA
          'login.twoFATitle': 'Code 2FA requis',
          'login.twoFACodeLabel': 'Code 2FA',
          'login.verify2FAButton': 'Vérifier le code',
          'login.cancelLogin': 'Annuler',
          // erreurs
          'errors.genericError': 'Une erreur est survenue',
          'errors.networkError': 'Erreur réseau',
          'errors.emailNotVerifiedSent': "Votre e-mail n'est pas vérifié",
        }
        return dict[key] ?? key
      },
      i18n: { language: 'fr' },
    }),
  }
})

// 2️⃣ Mock useAuthStore avec selector
const mockSetToken = vi.fn()
const mockClearToken = vi.fn()
vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: vi.fn((selector: any) =>
    selector({ setToken: mockSetToken, clearToken: mockClearToken })
  ),
}))

// 3️⃣ Mock useCartStore avec selector
const mockSetGuestCartId = vi.fn()
const mockLoadCart = vi.fn()
vi.mock('../stores/useCartStore', () => ({
  useCartStore: vi.fn((selector: any) =>
    selector({
      guestCartId: 'abc',
      setGuestCartId: mockSetGuestCartId,
      loadCart: mockLoadCart,
    })
  ),
}))

// 4️⃣ Mock de useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage, { type ApiResponse } from './LoginPage'
import * as authService from '../services/authService'
import * as authHelper from '../utils/authHelper'

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

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche les champs email, mot de passe et bouton', () => {
    render(<LoginPage />, { wrapper: MemoryRouter })
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /se connecter/i })
    ).toBeInTheDocument()
  })

  it('toggle visibilité du mot de passe', () => {
    render(<LoginPage />, { wrapper: MemoryRouter })
    const toggle = screen.getByLabelText(/afficher le mot de passe/i)
    fireEvent.click(toggle)
    expect(screen.getByLabelText(/cacher le mot de passe/i)).toBeTruthy()
  })

  it('login réussi sans 2FA appelle onLoginSuccess', async () => {
    vi.spyOn(authService, 'loginUser').mockResolvedValue(successResponse)
    const onLoginSpy = vi.spyOn(authHelper, 'onLoginSuccess').mockResolvedValue()
    render(<LoginPage />, { wrapper: MemoryRouter })

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )

    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(onLoginSpy).toHaveBeenCalledWith(
        'tok',
        'user',
        false,
        mockSetToken,
        mockSetGuestCartId,
        mockLoadCart,
        mockNavigate
      )
    })
  })

  it('affiche étape 2FA si le code twofa_required', async () => {
    vi.spyOn(authService, 'loginUser').mockRejectedValue({
      response: { status: 400, data: { code: 'twofa_required' } },
      isAxiosError: true,
    })
    render(<LoginPage />, { wrapper: MemoryRouter })

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/code 2fa/i)).toBeInTheDocument()
    })
  })

  it('affiche le lien de renvoi quand email_not_verified et renvoie', async () => {
    vi.spyOn(authService, 'loginUser').mockRejectedValue({
      response: { status: 400, data: { code: 'email_not_verified' } },
      isAxiosError: true,
    })
    vi
      .spyOn(authService, 'resendVerificationEmail')
      .mockResolvedValue({ status: 200, data: { message: 'sent' } })

    render(<LoginPage />, { wrapper: MemoryRouter })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'a@b.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(screen.getByText(/e-mail non vérifié/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/renvoyer le mail/i))

    await waitFor(() => {
      expect(
        screen.getByText(/e-mail renvoyé/i)
      ).toBeInTheDocument()
    })
  })

  it('affiche une erreur générique sur erreur 404 sans code', async () => {
    vi.spyOn(authService, 'loginUser').mockRejectedValue({
      response: { status: 404, data: {} },
      isAxiosError: true,
    })

    render(<LoginPage />, { wrapper: MemoryRouter })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'x@y.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /une erreur est survenue/i
      )
    })
  })

  it('affiche une erreur réseau sur exception non Axios', async () => {
    vi.spyOn(authService, 'loginUser').mockRejectedValue(new Error('network'))

    render(<LoginPage />, { wrapper: MemoryRouter })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'x@y.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /erreur réseau/i
      )
    })
  })

  it('annule la 2FA et appelle logout', async () => {
    vi.spyOn(authService, 'loginUser').mockRejectedValue({
      response: { status: 400, data: { code: 'twofa_required' } },
      isAxiosError: true,
    })
    const logoutSpy = vi
      .spyOn(authHelper, 'logout')
      .mockResolvedValue(undefined)

    render(<LoginPage />, { wrapper: MemoryRouter })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(
      screen.getByLabelText(/mot de passe/i, { selector: 'input' }),
      { target: { value: 'pwd' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() =>
      expect(screen.getByLabelText(/code 2fa/i)).toBeInTheDocument()
    )

    fireEvent.click(screen.getByText(/annuler/i))
    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalledWith(
        mockClearToken,
        mockSetGuestCartId,
        mockLoadCart,
        mockNavigate,
        '/login'
      )
    })
  })
})
