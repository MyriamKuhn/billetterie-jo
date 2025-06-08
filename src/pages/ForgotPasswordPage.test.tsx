import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ForgotPasswordPage from './ForgotPasswordPage'
import * as authService from '../services/authService'
import * as errorUtils from '../utils/errorUtils'
import * as logger from '../utils/logger'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// === Mocks ===
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('../stores/useLanguageStore', () => ({
  useLanguageStore: { getState: () => ({ lang: 'fr' }) },
}))
vi.mock('../components/Seo', () => ({ default: () => null }))
vi.mock('../components/PageWrapper', () => ({
  PageWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

describe('<ForgotPasswordPage />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // helper pour récupérer l'input e-mail
  function getEmailInput() {
    return screen.getByRole('textbox')
  }

  it('désactive le bouton si email invalide et affiche le helperText', () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)

    fireEvent.change(getEmailInput(), { target: { value: 'not-an-email' } })
    expect(screen.getByText('forgotPassword.invalidEmail')).toBeInTheDocument()

    const btn = screen.getByRole('button', { name: 'forgotPassword.button' })
    expect(btn).toBeDisabled()
  })

  it('active le bouton si email valide', () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)

    fireEvent.change(getEmailInput(), { target: { value: 'user@example.com' } })
    const btn = screen.getByRole('button', { name: 'forgotPassword.button' })
    expect(btn).toBeEnabled()
  })

  it('affiche un message de succès quand l’API renvoie 200', async () => {
    vi.spyOn(authService, 'passwordForgottenDemand')
      .mockResolvedValue({ status: 200, data: { message: 'OK' } })
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)

    fireEvent.change(getEmailInput(), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'forgotPassword.button' }))

    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('forgotPassword.successMessage')).toBeInTheDocument()
    })
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('affiche erreur métier quand API renvoie 4xx avec code', async () => {
    vi.spyOn(authService, 'passwordForgottenDemand')
      .mockRejectedValue({ response: { data: { code: 'some_error_code' } } })
    vi.spyOn(errorUtils, 'getErrorMessage').mockReturnValue('Erreur traduite')

    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)

    fireEvent.change(getEmailInput(), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'forgotPassword.button' }))

    await waitFor(() => {
      expect(screen.getByText('Erreur traduite')).toBeInTheDocument()
    })
  })

  it('affiche erreur réseau quand API jette une exception non Axios', async () => {
    vi.spyOn(authService, 'passwordForgottenDemand')
      .mockRejectedValue(new Error('Network fail'))
    vi.spyOn(errorUtils, 'getErrorMessage').mockReturnValue('Message réseau')

    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)

    fireEvent.change(getEmailInput(), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'forgotPassword.button' }))

    await waitFor(() => {
      expect(screen.getByText('Message réseau')).toBeInTheDocument()
    })
  })

  it('n’envoie pas la requête quand email invalide', () => {
    const spy = vi.spyOn(authService, 'passwordForgottenDemand')
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)

    fireEvent.change(getEmailInput(), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'forgotPassword.button' }))

    expect(spy).not.toHaveBeenCalled()
  })

  it('navigate vers /login quand on clique sur "Retour à la connexion"', () => {
    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('forgotPassword.backToLogin'))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  // === Nouveaux tests pour les branches non couvertes ===

  it('gère le cas Unexpected status (status non-2xx) et loggue l’erreur puis affiche network_error', async () => {
    vi.spyOn(authService, 'passwordForgottenDemand')
      .mockResolvedValue({ status: 300, data: { message: '' } })
    const logSpy = vi.spyOn(logger, 'logError')
    vi.spyOn(errorUtils, 'getErrorMessage').mockReturnValue('Network err')

    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)
    fireEvent.change(getEmailInput(), { target: { value: 'u@e.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'forgotPassword.button' }))

    await waitFor(() => {
      expect(screen.getByText('Network err')).toBeInTheDocument()
    })
    expect(logSpy).toHaveBeenCalledWith(
      'ForgotPasswordDemand:handleSubmit',
      new Error('Unexpected status')
    )
  })

  it('affiche generic_error si erreur Axios sans data.code', async () => {
    const axiosErr = new Error('oops') as any
    axiosErr.isAxiosError = true
    axiosErr.response = { data: {} }
    vi.spyOn(authService, 'passwordForgottenDemand').mockRejectedValue(axiosErr)
    vi.spyOn(errorUtils, 'getErrorMessage')
      .mockImplementation((_t, code) => code === 'generic_error' ? 'Générique' : '')

    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)
    fireEvent.change(getEmailInput(), { target: { value: 'u@e.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'forgotPassword.button' }))

    await waitFor(() => {
      expect(screen.getByText('Générique')).toBeInTheDocument()
    })
  })

  it('appelle getErrorMessage avec la bonne clé quand API renvoie une erreur métier (data.code)', async () => {
    // Simule une vraie erreur Axios
    const apiError = {
      isAxiosError: true,
      response: { data: { code: 'some_error_code' } },
    } as any
    vi.spyOn(authService, 'passwordForgottenDemand').mockRejectedValue(apiError)

    // On spy getErrorMessage pour capturer l’appel
    const getErrorSpy = vi.spyOn(errorUtils, 'getErrorMessage').mockReturnValue('Erreur traduite')

    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)

    // On remplit un email valide
    fireEvent.change(getEmailInput(), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'forgotPassword.button' }))

    await waitFor(() => {
      expect(screen.getByText('Erreur traduite')).toBeInTheDocument()
    })

    // On vérifie bien l’appel avec la clé 'some_error_code'
    expect(getErrorSpy).toHaveBeenCalledWith(expect.any(Function), 'some_error_code')
  })

  it('retourne immédiatement si email invalide (soumission du form)', () => {
    // On spy l’appel à l’API
    const spy = vi.spyOn(authService, 'passwordForgottenDemand')
    const { container } = render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)

    // On remplit un email invalide
    fireEvent.change(getEmailInput(), { target: { value: 'pasUnEmail' } })

    // On soumet directement le formulaire
    const form = container.querySelector('form')!
    fireEvent.submit(form)

    // Comme validEmail est false, on retourne immédiatement sans appeler l’API
    expect(spy).not.toHaveBeenCalled()
  })
})
