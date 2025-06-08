import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import * as validationHook from '../hooks/useSignupValidation'
import SignupPage from './SignupPage'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import * as authService from '../services/authService'

// ----------------------------------
//  Mocks initiaux
// ----------------------------------
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))

// Passe ces deux-là en vi.fn pour pouvoir mockReturnValue plus bas
vi.mock('@mui/material/styles', () => ({ useTheme: vi.fn(() => ({ palette: { mode: 'light' }, breakpoints: { down: () => 'sm' } })) }))
vi.mock('@mui/material/useMediaQuery', () => ({ __esModule: true, default: vi.fn(() => false) }))

vi.mock('../stores/useLanguageStore', () => ({
  useLanguageStore: (selector: (state: any) => any) => selector({ lang: 'fr' })
}))

const mockReset = vi.fn()

vi.mock('react-google-recaptcha', () => {
  const React = require('react')
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({ reset: mockReset }))
      return (
        <div
          data-testid="captcha"
          data-size={props.size}
          data-theme={props.theme}
          // clic simple → onChange
          onClick={() => props.onChange('token')}
          // double-clic → onExpired
          onDoubleClick={() => props.onExpired && props.onExpired()}
          // clic-droit → onErrored
          onContextMenu={(e) => {
            e.preventDefault()
            props.onErrored && props.onErrored()
          }}
        />
      )
    }),
  }
})

vi.mock('../components/PasswordWithConfirmation', () => ({
  __esModule: true,
  default: (props: any) => (
    <input
      data-testid="pw-confirm"
      value={`${props.password}|${props.confirmPassword}`}
      onChange={e => props.onPasswordChange(e.target.value.split('|')[0])}
      onBlur={props.onBlur}
    />
  )
}))

vi.mock('../components/Seo', () => ({ __esModule: true, default: (props: any) => <div data-testid="seo" data-title={props.title} data-desc={props.description} /> }))
vi.mock('../components/PageWrapper', () => ({ __esModule: true, PageWrapper: (props: any) => <div data-testid="wrapper">{props.children}</div> }))
vi.mock('../components/AlertMessage/AlertMessage', () => ({ __esModule: true, default: ({ message, severity }: any) => <div role="alert" data-sev={severity}>{message}</div> }))
vi.mock('../config', () => ({ RECAPTCHA_SITE_KEY: 'site-key' }))

const mockRegister = vi.fn()
vi.mock('../services/authService', () => ({ registerUser: (...args: any[]) => mockRegister(...args) }))
vi.mock('../utils/errorUtils', () => ({ getErrorMessage: (_t: any, code: string) => `ERR:${code}` }))

// Helper pour front-validation et erreurs réseau (inchangé)
async function submitForm(container: HTMLElement) {
  fireEvent.click(screen.getByTestId('captcha'))
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.submit(container.querySelector('form')!)
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

// ----------------------------------
//  Success flow
// ----------------------------------
describe('<SignupPage /> success flow', () => {
  beforeEach(() => {
    // 1. On mocke registerUser pour qu’il renvoie success
    vi.spyOn(authService, 'registerUser').mockResolvedValue({
      status: 201,
      data: {} as any,  
    })

    // 2. On force la validation front OK
    vi.spyOn(validationHook, 'useSignupValidation').mockReturnValue({
      firstnameError: false,
      lastnameError: false,
      emailError: false,
      pwStrong: true,
      pwsMatch: true,
      isFirstnameValid: true,
      isLastnameValid: true,
      isEmailValid: true,
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('affiche message succès et propose d’aller au login', async () => {
    const { container } = render(<SignupPage />)

    fireEvent.click(screen.getByTestId('captcha'))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.submit(container.querySelector('form')!)

    // on attend l’alerte succès
    const successAlert = await screen.findByRole('alert')
    expect(successAlert).toHaveTextContent('signup.successMessage')
    expect(mockReset).toHaveBeenCalled()

    // on vérifie que le lien vers /login est présent
    const loginLink = screen.getByRole('link', { name: 'signup.goToLogin' })
    expect(loginLink).toBeInTheDocument()
  })
})

// ----------------------------------
//  Field interactions
// ----------------------------------
describe('<SignupPage /> field interactions', () => {
  afterEach(() => cleanup())

  it('firstname onChange & onBlur déclenchent helperText', async () => {
    vi.spyOn(validationHook, 'useSignupValidation').mockReturnValue({
      firstnameError: true,
      lastnameError: false,
      emailError: false,
      pwStrong: true,
      pwsMatch: true,
      isFirstnameValid: false,
      isLastnameValid: true,
      isEmailValid: true,
    })

    render(<SignupPage />)
    const firstname = screen.getByRole('textbox', { name: /signup\.firstnameLabel/ })
    await act(() => fireEvent.change(firstname, { target: { value: 'John' } }))
    expect(firstname).toHaveValue('John')
    await act(() => fireEvent.blur(firstname))
    expect(await screen.findByText('errors.firstnameRequired')).toBeInTheDocument()
  })

  it('lastname onChange & onBlur déclenchent helperText', async () => {
    vi.spyOn(validationHook, 'useSignupValidation').mockReturnValue({
      firstnameError: false,
      lastnameError: true,
      emailError: false,
      pwStrong: true,
      pwsMatch: true,
      isFirstnameValid: true,
      isLastnameValid: false,
      isEmailValid: true,
    })

    render(<SignupPage />)
    const lastname = screen.getByRole('textbox', { name: /signup\.lastnameLabel/ })
    await act(() => fireEvent.change(lastname, { target: { value: 'Doe' } }))
    expect(lastname).toHaveValue('Doe')
    await act(() => fireEvent.blur(lastname))
    expect(await screen.findByText('errors.lastnameRequired')).toBeInTheDocument()
  })

  it('email onChange & onBlur déclenchent helperText', async () => {
    vi.spyOn(validationHook, 'useSignupValidation').mockReturnValue({
      firstnameError: false,
      lastnameError: false,
      emailError: true,
      pwStrong: true,
      pwsMatch: true,
      isFirstnameValid: true,
      isLastnameValid: true,
      isEmailValid: false,
    })

    render(<SignupPage />)
    const email = screen.getByRole('textbox', { name: /signup\.emailLabel/ })
    await act(() => fireEvent.change(email, { target: { value: 'foo@' } }))
    expect(email).toHaveValue('foo@')
    await act(() => fireEvent.blur(email))
    expect(await screen.findByText('errors.invalidEmail')).toBeInTheDocument()
  })
})

// ----------------------------------
//  ReCAPTCHA props
// ----------------------------------
describe('<SignupPage /> ReCAPTCHA affichage', () => {
  afterEach(() => cleanup())

  const mockMedia = useMediaQuery as unknown as jest.Mock
  const mockTh     = useTheme       as unknown as jest.Mock

  it.each([
    ['mobile dark', true,  { palette: { mode: 'dark' },  breakpoints: { down: () => true  } }, 'compact', 'dark'],
    ['desktop light', false,{ palette: { mode: 'light' }, breakpoints: { down: () => false } }, 'normal',  'light'],
  ])('%s → size=%s theme=%s', (_n, isMobile, themeObj, sz, th) => {
    mockMedia.mockReturnValue(isMobile)
    mockTh.mockReturnValue(themeObj)

    render(<SignupPage />)
    const captcha = screen.getByTestId('captcha')
    expect(captcha).toHaveAttribute('data-size', sz)
    expect(captcha).toHaveAttribute('data-theme', th)
  })
})

// ----------------------------------
//  ReCAPTCHA expired/errored
// ----------------------------------
describe('<SignupPage /> ReCAPTCHA expired/errored', () => {
  beforeEach(() => {
    vi.spyOn(validationHook, 'useSignupValidation').mockReturnValue({
      firstnameError: false,
      lastnameError: false,
      emailError: false,
      pwStrong: true,
      pwsMatch: true,
      isFirstnameValid: true,
      isLastnameValid: true,
      isEmailValid: true,
    })
  })
  afterEach(() => cleanup())

  it('reset token et disable submit après expiration/erreur', () => {
    render(<SignupPage />)
    const captcha = screen.getByTestId('captcha')
    const submit = screen.getByRole('button', { name: /signupButton/ })

    act(() => fireEvent(captcha, new Event('expired')))
    expect(submit).toBeDisabled()

    act(() => fireEvent(captcha, new Event('errored')))
    expect(submit).toBeDisabled()
  })
})

describe('<SignupPage /> PasswordWithConfirmation blur', () => {
  beforeEach(() => {
    // Mot de passe considéré comme pas assez fort et mismatch
    vi.spyOn(validationHook, 'useSignupValidation').mockReturnValue({
      firstnameError: false,
      lastnameError: false,
      emailError: false,
      pwStrong: false,
      pwsMatch: false,
      isFirstnameValid: true,
      isLastnameValid: true,
      isEmailValid: true,
    })
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('au blur du password, le submit reste désactivé', () => {
    render(<SignupPage />)
    const pwInput = screen.getByTestId('pw-confirm')
    const submit = screen.getByRole('button', { name: /signup\.signupButton/ })

    // Avant le blur, submit désactivé car pas de captcha/token
    expect(submit).toBeDisabled()

    // On blur pour passer pwdTouched à true
    fireEvent.blur(pwInput)

    // Toujours désactivé (password pas valide)
    expect(submit).toBeDisabled()
  })
})

describe('<SignupPage /> ReCAPTCHA expired/errored', () => {
  beforeEach(() => {
    vi.spyOn(validationHook, 'useSignupValidation').mockReturnValue({
      firstnameError: false,
      lastnameError: false,
      emailError: false,
      pwStrong: true,
      pwsMatch: true,
      isFirstnameValid: true,
      isLastnameValid: true,
      isEmailValid: true,
    })
    vi.spyOn(authService, 'registerUser').mockResolvedValue({ status: 201, data: {} as any })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('désactive le submit quand le captcha expire (double-clic)', () => {
    render(<SignupPage />)
    const captcha = screen.getByTestId('captcha')
    const submit = screen.getByRole('button', { name: /signup\.signupButton/ })

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(captcha)
    expect(submit).not.toBeDisabled()

    // Déclenche onExpired
    fireEvent.doubleClick(captcha)
    expect(submit).toBeDisabled()
  })

  it('désactive le submit quand le captcha échoue (clic droit)', () => {
    render(<SignupPage />)
    const captcha = screen.getByTestId('captcha')
    const submit = screen.getByRole('button', { name: /signup\.signupButton/ })

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(captcha)
    expect(submit).not.toBeDisabled()

    // Déclenche onErrored
    fireEvent.contextMenu(captcha)
    expect(submit).toBeDisabled()
  })
})

// ----------------------------------
//  Success 201 (couvre if (status===201) et reset captcha)
// ----------------------------------
it('setSuccessMsg et reset captcha quand registerUser renvoie 201', async () => {
  vi.spyOn(authService, 'registerUser').mockResolvedValue({
    status: 201,
    data: {} as any, 
  })
  vi.spyOn(validationHook, 'useSignupValidation').mockReturnValue({
    firstnameError: false,
    lastnameError: false,
    emailError: false,
    pwStrong: true,
    pwsMatch: true,
    isFirstnameValid: true,
    isLastnameValid: true,
    isEmailValid: true,
  })

  const { container } = render(<SignupPage />)
  fireEvent.click(screen.getByTestId('captcha'))
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.submit(container.querySelector('form')!)

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveAttribute('data-sev', 'success')
  expect(alert).toHaveTextContent('signup.successMessage')
  expect(mockReset).toHaveBeenCalled()
})

// ----------------------------------
//  422 validation_error sans data.errors (couvre le "|| []")
// ----------------------------------
it('gère 422 validation_error quand data.errors est undefined', async () => {
  vi.spyOn(authService, 'registerUser').mockRejectedValue({
    isAxiosError: true,
    response: { status: 422, data: { code: 'validation_error' } },
  })
  vi.spyOn(validationHook, 'useSignupValidation').mockReturnValue({
    firstnameError: false,
    lastnameError: false,
    emailError: false,
    pwStrong: true,
    pwsMatch: true,
    isFirstnameValid: true,
    isLastnameValid: true,
    isEmailValid: true,
  })

  const { container } = render(<SignupPage />)
  fireEvent.click(screen.getByTestId('captcha'))
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.submit(container.querySelector('form')!)

  const errorAlert = await screen.findByRole('alert')
  expect(errorAlert).toHaveAttribute('data-sev', 'error')
  expect(errorAlert).toHaveTextContent('ERR:validation_error')
})

it('ne fait rien quand registerUser renvoie un statut ≠ 201', async () => {
  // Remise à zéro du spy
  mockReset.mockClear();

  // 1) stub registerUser pour renvoyer 200
  vi.spyOn(authService, 'registerUser')
    .mockResolvedValue({ status: 200, data: {} } as any);

  // 2) front-validation OK
  vi.spyOn(validationHook, 'useSignupValidation').mockReturnValue({
    firstnameError:    false,
    lastnameError:     false,
    emailError:        false,
    pwStrong:          true,
    pwsMatch:          true,
    isFirstnameValid:  true,
    isLastnameValid:   true,
    isEmailValid:      true,
  });

  const { container } = render(<SignupPage />);

  // 3) on simule captcha + TOS
  fireEvent.click(screen.getByTestId('captcha'));
  fireEvent.click(screen.getByRole('checkbox'));

  // 4) on soumet dans un act pour attendre la promesse interne
  await act(async () => {
    fireEvent.submit(container.querySelector('form')!);
  });

  // 5) Aucune alerte “success” ne doit apparaître
  expect(screen.queryByText('signup.successMessage')).toBeNull();

  // 6) mockReset n’a PAS été appelé cette fois
  expect(mockReset).toHaveBeenCalledTimes(0);
});