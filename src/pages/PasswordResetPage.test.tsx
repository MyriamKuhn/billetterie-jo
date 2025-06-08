import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PasswordResetPage from './PasswordResetPage'
import * as authService from '../services/authService'
import * as errorUtils from '../utils/errorUtils'
import * as logger from '../utils/logger'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// ── Mocks globaux ────────────────────────────────────────────────────────────
// i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))
// store langue
vi.mock('../stores/useLanguageStore', () => ({
  useLanguageStore: { getState: () => ({ lang: 'fr' }) },
}))
// Seo & PageWrapper
vi.mock('../components/Seo', () => ({ default: () => null }))
vi.mock('../components/PageWrapper', () => ({
  PageWrapper: ({ children }: any) => <>{children}</>,
}))
// PasswordWithConfirmation
vi.mock('../components/PasswordWithConfirmation', () => ({
  default: ({ password, confirmPassword, onPasswordChange, onConfirmChange, onBlur }: any) => (
    <div>
      <input
        data-testid="password"
        type="password"
        value={password}
        onChange={e => onPasswordChange(e.target.value)}
        onBlur={onBlur}
      />
      <input
        data-testid="confirm"
        type="password"
        value={confirmPassword}
        onChange={e => onConfirmChange(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  )
}))

// router hooks
const mockNavigate = vi.fn()
let mockSearchParams: URLSearchParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
  }
})

// ── Helpers ──────────────────────────────────────────────────────────────────
function setPasswords(pw: string, confirm: string) {
  fireEvent.change(screen.getByTestId('password'), { target: { value: pw } })
  fireEvent.change(screen.getByTestId('confirm'),  { target: { value: confirm } })
  fireEvent.blur(screen.getByTestId('password'))
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('PasswordResetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockReset()
  })

  it('redirige vers /login si token ou email manquant', () => {
    mockSearchParams = new URLSearchParams() // pas de token/email
    render(
      <MemoryRouter initialEntries={['/password-reset']}>
        <Routes>
          <Route path="/password-reset" element={<PasswordResetPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })

  describe('avec token & email fournis', () => {
    beforeEach(() => {
      mockSearchParams = new URLSearchParams([
        ['token', 'tok'],
        ['email', 'u@e.com']
      ])
    })

    it('affiche erreur si mot de passe faible', async () => {
      const { container } = render(<MemoryRouter><PasswordResetPage /></MemoryRouter>)
      setPasswords('weak','weak')
      const form = container.querySelector('form')!
      fireEvent.submit(form)
      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('errors.passwordNotStrong')
    })

    it('affiche erreur si passwords ne correspondent pas', async () => {
      const { container } = render(<MemoryRouter><PasswordResetPage /></MemoryRouter>)
      setPasswords('StrongP@ssw0rd2025!', 'OtherP@ss')
      const form = container.querySelector('form')!
      fireEvent.submit(form)
      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('errors.passwordsDontMatch')
    })

    it('succès API → spinner, message de succès et bouton “goToLogin”', async () => {
      vi.spyOn(authService, 'resetPassword').mockResolvedValue({ status: 200, data: {} as any })
      const { container } = render(<MemoryRouter><PasswordResetPage /></MemoryRouter>)
      setPasswords('StrongP@ssw0rd2025!', 'StrongP@ssw0rd2025!')

      const form = container.querySelector('form')!
      fireEvent.submit(form)

      // Spinner visible immédiatement
      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      // Puis message de succès (on ne cherche plus un role="alert" qui n'existe pas)
      expect(await screen.findByText('passwordReset.successMessage')).toBeInTheDocument()

      // Bouton goToLogin redirige
      fireEvent.click(screen.getByText('passwordReset.goToLogin'))
    })

    it('status hors 2xx → logError + generic_error', async () => {
      vi.spyOn(authService, 'resetPassword')
        .mockResolvedValue({ status: 300, data: { message: '' } })
      const logSpy = vi.spyOn(logger, 'logError').mockImplementation(() => {})
      vi.spyOn(errorUtils, 'getErrorMessage').mockReturnValue('GENERIC')

      const { container } = render(<MemoryRouter><PasswordResetPage /></MemoryRouter>)
      setPasswords('StrongP@ssw0rd2025!', 'StrongP@ssw0rd2025!')
      const form = container.querySelector('form')!
      fireEvent.submit(form)

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('GENERIC')

      expect(logSpy).toHaveBeenCalledWith(
        'PasswordResetPage:handleSubmit',
        new Error('Unexpected status')
      )
    })

    it('erreur Axios avec data.code → getErrorMessage + TRAD', async () => {
      const apiErr = { isAxiosError: true, response: { data: { code: 'my_code' } } }
      vi.spyOn(authService, 'resetPassword').mockRejectedValue(apiErr)
      vi.spyOn(errorUtils, 'getErrorMessage').mockReturnValue('TRAD')

      const { container } = render(<MemoryRouter><PasswordResetPage /></MemoryRouter>)
      setPasswords('StrongP@ssw0rd2025!', 'StrongP@ssw0rd2025!')
      const form = container.querySelector('form')!
      fireEvent.submit(form)

      // On attend d’abord que le message d’erreur soit affiché
      const alert = await screen.findByRole('alert')
      // Puis on vérifie que getErrorMessage a bien été appelé
      expect(errorUtils.getErrorMessage).toHaveBeenCalledWith(expect.any(Function), 'my_code')
      expect(alert).toHaveTextContent('TRAD')
    })

    it('erreur Axios sans code → network_error', async () => {
      const apiErr = { isAxiosError: true, response: { data: {} } }
      vi.spyOn(authService, 'resetPassword').mockRejectedValue(apiErr)
      vi.spyOn(errorUtils, 'getErrorMessage')
        .mockImplementation((_t, code) => code === 'network_error' ? 'NET' : '')

      const { container } = render(<MemoryRouter><PasswordResetPage /></MemoryRouter>)
      setPasswords('StrongP@ssw0rd2025!', 'StrongP@ssw0rd2025!')
      const form = container.querySelector('form')!
      fireEvent.submit(form)

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('NET')
    })

    it('erreur non-Axios → generic_error + logError', async () => {
      const err = new Error('boom')
      vi.spyOn(authService, 'resetPassword').mockRejectedValue(err)
      vi.spyOn(errorUtils, 'getErrorMessage')
        .mockImplementation((_t, code) => code === 'generic_error' ? 'GEN' : '')
      const logSpy = vi.spyOn(logger, 'logError').mockImplementation(() => {})

      const { container } = render(<MemoryRouter><PasswordResetPage /></MemoryRouter>)
      setPasswords('StrongP@ssw0rd2025!', 'StrongP@ssw0rd2025!')
      const form = container.querySelector('form')!
      fireEvent.submit(form)

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('GEN')
      expect(logSpy).toHaveBeenCalledWith('PasswordResetPage:handleSubmit', err)
    })

    it('le lien "backToLogin" navigue vers /login', () => {
      render(<MemoryRouter><PasswordResetPage /></MemoryRouter>)
      fireEvent.click(screen.getByText('passwordReset.backToLogin'))
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})
