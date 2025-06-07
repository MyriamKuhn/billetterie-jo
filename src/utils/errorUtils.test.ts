// src/utils/errorUtils.test.ts
import { describe, it, expect } from 'vitest'
import { getErrorMessage } from './errorUtils'
import type { TFunction } from 'i18next'

describe('getErrorMessage', () => {
  // A fake t function that returns the key in uppercase for clarity
  const t = ((key: string) => key.toUpperCase()) as unknown as TFunction

  it('returns errors.invalidCredentials for invalid_credentials', () => {
    expect(getErrorMessage(t, 'invalid_credentials')).toBe('ERRORS.INVALIDCREDENTIALS')
  })

  it('returns errors.accountDisabled for account_disabled', () => {
    expect(getErrorMessage(t, 'account_disabled')).toBe('ERRORS.ACCOUNTDISABLED')
  })

  it('returns errors.twofaInvalid for twofa_invalid', () => {
    expect(getErrorMessage(t, 'twofa_invalid')).toBe('ERRORS.TWOFAINVALID')
  })

  it('returns errors.userNotFound for user_not_found', () => {
    expect(getErrorMessage(t, 'user_not_found')).toBe('ERRORS.USERNOTFOUND')
  })

  it('returns errors.alreadyVerified for already_verified', () => {
    expect(getErrorMessage(t, 'already_verified')).toBe('ERRORS.ALREADYVERIFIED')
  })

  it('returns errors.tooManyRequests for too_many_requests', () => {
    expect(getErrorMessage(t, 'too_many_requests')).toBe('ERRORS.TOOMANYREQUESTS')
  })

  it('returns errors.genericError for an unknown code', () => {
    expect(getErrorMessage(t, 'some_random_code')).toBe('ERRORS.GENERICERROR')
  })

  it('returns errors.genericError when code is undefined', () => {
    expect(getErrorMessage(t)).toBe('ERRORS.GENERICERROR')
  })
})
