import { useMemo } from 'react';
import { isStrongPassword, isEmailValid } from '../utils/validation';

export interface SignupValidationParams {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstnameTouched: boolean;
  lastnameTouched: boolean;
  emailTouched: boolean;
}

/**
 * Custom hook for signup form validation.
 * Returns flags for individual field errors and overall validity.
 */
export function useSignupValidation({
  firstname,
  lastname,
  email,
  password,
  confirmPassword,
  firstnameTouched,
  lastnameTouched,
  emailTouched,
}: SignupValidationParams) {
  // Show error only after the field has been touched
  const firstnameError = firstnameTouched && firstname.trim() === '';
  const lastnameError  = lastnameTouched  && lastname.trim() === '';
  const emailError     = emailTouched     && !isEmailValid(email);

  // Compute password strength and match only when dependencies change
  const pwStrong  = useMemo(() => isStrongPassword(password), [password]);
  const pwsMatch  = useMemo(() => password === confirmPassword, [password, confirmPassword]);

  return {
    // Individual field error flags
    firstnameError, lastnameError, emailError,
    // Password criteria
    pwStrong, pwsMatch,
    // Overall validity flags
    isFirstnameValid: firstname.trim() !== '',
    isLastnameValid:  lastname.trim()  !== '',
    isEmailValid:     isEmailValid(email),
  };
}
