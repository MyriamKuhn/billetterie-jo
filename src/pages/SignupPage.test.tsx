import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import * as validationHook from '../hooks/useSignupValidation'
import SignupPage from './SignupPage'

// Mocks externals
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))
vi.mock('@mui/material/styles', () => ({ useTheme: () => ({ palette: { mode: 'light' }, breakpoints: { down: () => 'sm' } }) }))
vi.mock('@mui/material/useMediaQuery', () => ({ __esModule: true, default: () => false }))
vi.mock('../stores/useLanguageStore', () => ({ useLanguageStore: () => 'fr' }))

const mockReset = vi.fn()
vi.mock('react-google-recaptcha', () => ({
  __esModule: true,
  default: React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ reset: mockReset }))
    return <div data-testid="captcha" onClick={() => props.onChange('token')} />
  }),
}))

vi.mock('../components/PasswordWithConfirmation', () => ({ __esModule: true, default: (props: any) => <input data-testid="pw-confirm" value={`${props.password}|${props.confirmPassword}`} onChange={e => props.onPasswordChange(e.target.value.split('|')[0])} onBlur={props.onBlur} /> }))
vi.mock('../components/Seo', () => ({ __esModule: true, default: (props: any) => <div data-testid="seo" data-title={props.title} data-desc={props.description} /> }))
vi.mock('../components/PageWrapper', () => ({ __esModule: true, PageWrapper: (props: any) => <div data-testid="wrapper">{props.children}</div> }))
vi.mock('../components/AlertMessage/AlertMessage', () => ({ __esModule: true, default: ({ message, severity }: any) => <div role="alert" data-sev={severity}>{message}</div> }))
vi.mock('../config', () => ({ RECAPTCHA_SITE_KEY: 'site-key' }))

const mockRegister = vi.fn()
vi.mock('../services/authService', () => ({ registerUser: (...args: any[]) => mockRegister(...args) }))
vi.mock('../utils/errorUtils', () => ({ getErrorMessage: (_t: any, code: string) => `ERR:${code}` }))

// Helper to submit form with captcha and TOS
async function submitForm(container: HTMLElement) {
  fireEvent.click(screen.getByTestId('captcha'))
  fireEvent.click(screen.getByRole('checkbox'))
  await act(async () => {
    fireEvent.submit(container.querySelector('form')!)
  })
}

// ------- Front validation tests -------
describe('<SignupPage /> front validation', () => {
  let spy: any
  beforeEach(() => { spy = vi.spyOn(validationHook, 'useSignupValidation') })
  afterEach(() => { spy.mockRestore(); cleanup() })

  it('blocks if password too weak then mismatch', async () => {
    spy.mockReturnValue({ firstnameError: false, lastnameError: false, emailError: false, pwStrong: false, pwsMatch: true, isFirstnameValid: true, isLastnameValid: true, isEmailValid: true })
    const { container } = render(<SignupPage />)
    await submitForm(container)
    expect(await screen.findByRole('alert')).toHaveTextContent('errors.passwordNotStrong')

    spy.mockReturnValue({ firstnameError: false, lastnameError: false, emailError: false, pwStrong: true, pwsMatch: false, isFirstnameValid: true, isLastnameValid: true, isEmailValid: true })
    cleanup()
    const { container: c2 } = render(<SignupPage />)
    await submitForm(c2)
    expect(await screen.findByRole('alert')).toHaveTextContent('errors.passwordsDontMatch')
  })

  it('blocks if no TOS then no captcha', async () => {
    spy.mockReturnValue({ firstnameError: false, lastnameError: false, emailError: false, pwStrong: true, pwsMatch: true, isFirstnameValid: true, isLastnameValid: true, isEmailValid: true })
    const { container } = render(<SignupPage />)
    // submit without TOS
    await act(async () => { fireEvent.submit(container.querySelector('form')!) })
    expect(await screen.findByRole('alert')).toHaveTextContent('errors.mustAgreeTOS')
    // then TOS but no captcha
    fireEvent.click(screen.getByRole('checkbox'))
    await act(async () => { fireEvent.submit(container.querySelector('form')!) })
    expect(await screen.findByRole('alert')).toHaveTextContent('errors.captchaRequired')
  })
})


// ------- Business & network error tests -------
describe('<SignupPage /> business and network errors', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockRegister.mockReset()
    mockReset.mockReset()
    vi.spyOn(validationHook, 'useSignupValidation').mockReturnValue({ firstnameError: false, lastnameError: false, emailError: false, pwStrong: true, pwsMatch: true, isFirstnameValid: true, isLastnameValid: true, isEmailValid: true })
  })
  afterEach(() => { cleanup() })

  it('429 Too Many Requests', async () => {
    mockRegister.mockRejectedValue({ response: { status: 429 }, isAxiosError: true })
    const { container } = render(<SignupPage />)
    await submitForm(container)
    expect(await screen.findByRole('alert')).toHaveTextContent('ERR:too_many_requests')
  })

  it('500 Internal Error', async () => {
    mockRegister.mockRejectedValue({ response: { status: 500 }, isAxiosError: true })
    const { container } = render(<SignupPage />)
    await submitForm(container)
    expect(await screen.findByRole('alert')).toHaveTextContent('ERR:internal_error')
  })

  it('422 unique email', async () => {
    mockRegister.mockRejectedValue({ response: { status: 422, data: { code: 'validation_error', errors: { email: ['validation.unique'] } } }, isAxiosError: true })
    const { container } = render(<SignupPage />)
    await submitForm(container)
    expect(await screen.findByRole('alert')).toHaveTextContent('ERR:email_already_registered')
  })

  it('422 generic validation', async () => {
    mockRegister.mockRejectedValue({ response: { status: 422, data: { code: 'validation_error', errors: { email: [] } } }, isAxiosError: true })
    const { container } = render(<SignupPage />)
    await submitForm(container)
    expect(await screen.findByRole('alert')).toHaveTextContent('ERR:validation_error')
  })

  it('custom business code', async () => {
    mockRegister.mockRejectedValue({ response: { status: 400, data: { code: 'some_code' } }, isAxiosError: true })
    const { container } = render(<SignupPage />)
    await submitForm(container)
    expect(await screen.findByRole('alert')).toHaveTextContent('ERR:some_code')
  })

  it('generic_error if no code', async () => {
    mockRegister.mockRejectedValue({ response: { status: 400, data: {} }, isAxiosError: true })
    const { container } = render(<SignupPage />)
    await submitForm(container)
    expect(await screen.findByRole('alert')).toHaveTextContent('ERR:generic_error')
  })

  it('network error', async () => {
    mockRegister.mockRejectedValue(new Error('network'))
    const { container } = render(<SignupPage />)
    await submitForm(container)
    expect(await screen.findByRole('alert')).toHaveTextContent('ERR:network_error')
  })
})
