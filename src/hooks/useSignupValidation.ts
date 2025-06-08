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
  const firstnameError = firstnameTouched && firstname.trim() === '';
  const lastnameError  = lastnameTouched  && lastname.trim() === '';
  const emailError     = emailTouched     && !isEmailValid(email);

  const pwStrong  = useMemo(() => isStrongPassword(password), [password]);
  const pwsMatch  = useMemo(() => password === confirmPassword, [password, confirmPassword]);

  return {
    firstnameError, lastnameError, emailError,
    pwStrong, pwsMatch,
    isFirstnameValid: firstname.trim() !== '',
    isLastnameValid:  lastname.trim()  !== '',
    isEmailValid:     isEmailValid(email),
  };
}
