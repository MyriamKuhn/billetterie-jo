// src/pages/SignupPageExtra.test.tsx
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SignupPage from './SignupPage';
import * as authService from '../services/authService';
import * as signupValidationModule from '../hooks/useSignupValidation';

// 1) Partial mock for react-i18next so initReactI18next is preserved
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { changeLanguage: () => Promise.resolve() },
    }),
  };
});

// 2) Mock our validation hook
vi.mock('../hooks/useSignupValidation', () => ({
  useSignupValidation: vi.fn(),
}));

// 3) Mock registerUser
vi.mock('../services/authService', () => ({
  registerUser: vi.fn(),
}));
const mockedRegisterUser = authService.registerUser as ReturnType<typeof vi.fn>;

// 4) Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// 5) Mock ReCAPTCHA
vi.mock('react-google-recaptcha', () => ({
  __esModule: true,
  default: React.forwardRef((props: any, ref: any) => (
    <div data-testid="recaptcha-mock" ref={ref}>
      <button onClick={() => props.onChange('fake-token')}>
        Complete Captcha
      </button>
      <button onClick={() => props.onExpired()}>Expire Captcha</button>
      <button onClick={() => props.onErrored()}>Error Captcha</button>
    </div>
  )),
}));

// Helper to fill the form and accept TOS + captcha
function fillAndAcceptAll() {
  fireEvent.change(screen.getByLabelText(/firstname/i), {
    target: { value: 'John' },
  });
  fireEvent.change(screen.getByLabelText(/lastname/i), {
    target: { value: 'Doe' },
  });
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'john@example.com' },
  });
  fireEvent.click(screen.getByLabelText(/agree/i));
  fireEvent.click(screen.getByText(/Complete Captcha/i));
}

describe('<SignupPage />', () => {
  // Cast the mocked hook so TS knows about mockReturnValue
  const mockUseSignupValidation = signupValidationModule
    .useSignupValidation as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();

    // Default: no errors, everything valid
    mockUseSignupValidation.mockReturnValue({
      firstnameError: false,
      lastnameError: false,
      emailError: false,
      pwStrong: true,
      pwsMatch: true,
      isFirstnameValid: true,
      isLastnameValid: true,
      isEmailValid: true,
    });

    mockedRegisterUser.mockResolvedValue({ status: 201 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles captcha expiration correctly', async () => {
    render(<SignupPage />);
    fillAndAcceptAll();

    // Initially, submit button should be enabled
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /signupButton/i })
      ).not.toBeDisabled();
    });

    // Expire captcha -> button disabled
    fireEvent.click(screen.getByText(/Expire Captcha/i));
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /signupButton/i })
      ).toBeDisabled();
    });
  });

  it('handles captcha error correctly', async () => {
    render(<SignupPage />);
    fillAndAcceptAll();

    // Initially, submit button should be enabled
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /signupButton/i })
      ).not.toBeDisabled();
    });

    // Error captcha -> button disabled
    fireEvent.click(screen.getByText(/Error Captcha/i));
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /signupButton/i })
      ).toBeDisabled();
    });
  });

  it('shows success message and redirects after 5s on status 201', async () => {
    render(<SignupPage />);
    fillAndAcceptAll();

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /signupButton/i }));

    // Success alert appears
    await screen.findByText('signup.successMessage');

    // Advance timers by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('displays email helper text on blur when validation flags an error', async () => {
    // Simulate email validation error after blur
    mockUseSignupValidation.mockReturnValue({
      firstnameError: false,
      lastnameError: false,
      emailError: true,
      pwStrong: true,
      pwsMatch: true,
      isFirstnameValid: true,
      isLastnameValid: true,
      isEmailValid: false,
    });

    render(<SignupPage />);
    const emailInput = screen.getByLabelText(/email/i);

    fireEvent.blur(emailInput);

    expect(
      await screen.findByText('errors.invalidEmail')
    ).toBeInTheDocument();
  });

  it('displays password-mismatch error on PasswordWithConfirmation blur', async () => {
    // Simulate mismatch after touched
    mockUseSignupValidation.mockReturnValue({
      firstnameError: false,
      lastnameError: false,
      emailError: false,
      pwStrong: true,
      pwsMatch: false,
      isFirstnameValid: true,
      isLastnameValid: true,
      isEmailValid: true,
    });

    render(<SignupPage />);
    const pwd = screen.getByLabelText(/password/i);
    const confirm = screen.getByLabelText(/confirm password/i);

    fireEvent.focus(pwd);
    fireEvent.blur(pwd);
    fireEvent.focus(confirm);
    fireEvent.blur(confirm);

    expect(
      await screen.findByText('errors.passwordsDontMatch')
    ).toBeInTheDocument();
  });
});
