import type { TFunction } from "i18next";

export function getErrorMessage(t: TFunction, code?: string) {
  // 1) on monte un traducteur dédié au namespace "errors"
  const te = (key: string) => t(key, { ns: 'errors' });

  switch (code) {
    // Login / 2FA
    case 'invalid_credentials':      return te('invalidCredentials');
    case 'account_disabled':         return te('accountDisabled');
    case 'twofa_invalid':            return te('twofaInvalid');
    case 'twofa_required':           return te('twofaRequired');
    case 'user_not_found':           return te('userNotFound');
    case 'already_verified':         return te('alreadyVerified');
    case 'email_not_verified':       return te('emailNotVerified');
    case 'too_many_requests':        return te('tooManyRequests');

    // Registration
    case 'validation_error':         return te('validationError');
    case 'email_already_registered': return te('emailAlreadyRegistered');
    case 'password_too_weak':        return te('passwordTooWeak');
    case 'captcha_failed':           return te('captchaFailed');
    case 'captcha_invalid':          return te('captchaInvalid');
    case 'terms_not_accepted':       return te('termsNotAccepted');

    // Server / Network
    case 'internal_error':           return te('internalError');
    case 'service_unavailable':      return te('serviceUnavailable');
    case 'network_error':            return te('networkError');

    // Generic fallback
    default:                         return te('genericError');
  }
}
