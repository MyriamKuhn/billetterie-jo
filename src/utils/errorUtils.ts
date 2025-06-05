import type { TFunction } from "i18next";

export function getErrorMessage(t: TFunction, code?: string) {
  switch (code) {
    case 'invalid_credentials': return t('errors.invalidCredentials');
    case 'account_disabled':    return t('errors.accountDisabled');
    case 'twofa_invalid':       return t('errors.twofaInvalid');
    case 'user_not_found':      return t('errors.userNotFound');
    case 'already_verified':    return t('errors.alreadyVerified');
    case 'too_many_requests':   return t('errors.tooManyRequests');
    default:                    return t('errors.genericError');
  }
}