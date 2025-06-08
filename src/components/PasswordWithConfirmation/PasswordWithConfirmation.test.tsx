import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PasswordWithConfirmation, { type PasswordWithConfirmationProps } from './PasswordWithConfirmation'

// 1️⃣ Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // renvoie juste la clé pour simplifier
      return key
    },
  }),
}))

// 2️⃣ Mocks pour les icons MUI (on ne veut pas tester le rendu SVG)
vi.mock('@mui/icons-material/CheckCircle',        () => ({ __esModule: true, default: () => <span data-testid="icon-check" /> }))
vi.mock('@mui/icons-material/RadioButtonUnchecked',() => ({ __esModule: true, default: () => <span data-testid="icon-uncheck" /> }))
vi.mock('@mui/icons-material/Visibility',         () => ({ __esModule: true, default: () => <span data-testid="icon-vis" /> }))
vi.mock('@mui/icons-material/VisibilityOff',      () => ({ __esModule: true, default: () => <span data-testid="icon-vis-off" /> }))

describe('<PasswordWithConfirmation />', () => {
  const setup = (override?: Partial<PasswordWithConfirmationProps>) => {
    const props: PasswordWithConfirmationProps = {
      password: '',
      confirmPassword: '',
      touched: false,
      onPasswordChange: vi.fn(),
      onConfirmChange: vi.fn(),
      onBlur: vi.fn(),
      ...override,
    }
    render(<PasswordWithConfirmation {...props} />)
    return props
  }

  it('affiche deux champs password et confirm en type="password" par défaut', () => {
    setup()
    const pwField = screen.getByLabelText(/signup\.passwordLabel/i)
    const confirmField = screen.getByLabelText(/signup\.confirmPasswordLabel/i)
    expect(pwField).toHaveAttribute('type', 'password')
    expect(confirmField).toHaveAttribute('type', 'password')
  })

  it('toggle affichage mot de passe et confirm', () => {
    setup()
    const pwToggle = screen.getAllByRole('button')[0]
    const confirmToggle = screen.getAllByRole('button')[1]

    // bascule password
    fireEvent.click(pwToggle)
    expect(pwToggle).toHaveAttribute('aria-label', 'signup.hidePassword')
    expect(screen.getByTestId('icon-vis-off')).toBeInTheDocument()
    // bascule confirm
    fireEvent.click(confirmToggle)
    expect(confirmToggle).toHaveAttribute('aria-label', 'signup.hidePassword')
    expect(screen.getAllByTestId('icon-vis-off').length).toBe(2)
  })

  it('appelle onPasswordChange et onBlur quand on tape et sort focus', () => {
    const { onPasswordChange, onBlur } = setup()
    const pwField = screen.getByLabelText(/signup\.passwordLabel/i)
    fireEvent.change(pwField, { target: { value: 'abc' } })
    expect(onPasswordChange).toHaveBeenCalledWith('abc')
    fireEvent.blur(pwField)
    expect(onBlur).toHaveBeenCalled()
  })

  it('affiche checklist avec icônes uncheck pour mot de passe vide', () => {
    setup({ password: '' })
    // 5 critères
    const unchecks = screen.getAllByTestId('icon-uncheck')
    expect(unchecks).toHaveLength(5)
  })

  it('affiche checklist avec icônes check pour mot de passe fort (>=15, majuscule, minuscule, chiffre, spécial)', () => {
    const strong = 'Abcdefghijklm1!' // 16 chars, une maj, une min, un chiffre, un spécial
    setup({ password: strong })
    const checks = screen.getAllByTestId('icon-check')
    expect(checks).toHaveLength(5)
  })

  it('ne montre pas d’erreur tant que touched=false', () => {
    setup({ password: 'short', confirmPassword: 'short', touched: false })
    const pwInput = screen.getByLabelText(/signup\.passwordLabel/i)
    const confirmInput = screen.getByLabelText(/signup\.confirmPasswordLabel/i)
    expect(pwInput).toHaveAttribute('aria-invalid', 'false')
    expect(confirmInput).toHaveAttribute('aria-invalid', 'false')
    expect(screen.queryByText('signup.hintPasswordCriteria')).toBeNull()
    expect(screen.queryByText('signup.hintPasswordsDontMatch')).toBeNull()
  })

  it('montre erreur et helperText quand password trop faible et touched=true', () => {
    setup({ password: 'short', confirmPassword: 'short', touched: true })
    const pwInput = screen.getByLabelText(/signup\.passwordLabel/i)
    expect(pwInput).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('signup.hintPasswordCriteria')).toBeInTheDocument()
  })

  it('montre erreur et helperText quand confirm ne matche pas et touched=true', () => {
    setup({ password: 'VeryStrongPass1!', confirmPassword: 'diff', touched: true })
    const confirmInput = screen.getByLabelText(/signup\.confirmPasswordLabel/i)
    expect(confirmInput).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('signup.hintPasswordsDontMatch')).toBeInTheDocument()
  })

  it('n’affiche pas d’erreur confirm quand passwords match même si touched=true', () => {
    const pass = 'VeryStrongPass1!'
    setup({ password: pass, confirmPassword: pass, touched: true })
    const confirmInput = screen.getByLabelText(/signup\.confirmPasswordLabel/i)
    expect(confirmInput).toHaveAttribute('aria-invalid', 'false')
    expect(screen.queryByText('signup.hintPasswordsDontMatch')).toBeNull()
  })

  it('appelle onConfirmChange quand on tape dans le champ de confirmation', () => {
    const { onConfirmChange } = setup()
    // on récupère l'input de confirmation via regex sur le label
    const confirmField = screen.getByLabelText(/signup\.confirmPasswordLabel/i)
    fireEvent.change(confirmField, { target: { value: 'myConfirm123' } })
    expect(onConfirmChange).toHaveBeenCalledWith('myConfirm123')
  })
})
