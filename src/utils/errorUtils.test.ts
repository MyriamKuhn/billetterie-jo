import { describe, it, expect } from 'vitest'
import { getErrorMessage } from './errorUtils'
import type { TFunction } from 'i18next'

describe('getErrorMessage', () => {
  // A fake t function that returns the key in uppercase for clarity
  const t = ((key: string) => key.toUpperCase()) as unknown as TFunction

  // Login / 2FA
  it('returns INVALIDCREDENTIALS for invalid_credentials', () => {
    expect(getErrorMessage(t, 'invalid_credentials')).toBe('INVALIDCREDENTIALS')
  })

  it('returns ACCOUNTDISABLED for account_disabled', () => {
    expect(getErrorMessage(t, 'account_disabled')).toBe('ACCOUNTDISABLED')
  })

  it('returns TWOFAINVALID for twofa_invalid', () => {
    expect(getErrorMessage(t, 'twofa_invalid')).toBe('TWOFAINVALID')
  })

  it('returns TWOFAREQUIRED for twofa_required', () => {
    expect(getErrorMessage(t, 'twofa_required')).toBe('TWOFAREQUIRED')
  })

  it('returns USERNOTFOUND for user_not_found', () => {
    expect(getErrorMessage(t, 'user_not_found')).toBe('USERNOTFOUND')
  })

  it('returns ALREADYVERIFIED for already_verified', () => {
    expect(getErrorMessage(t, 'already_verified')).toBe('ALREADYVERIFIED')
  })

  it('returns EMAILNOTVERIFIED for email_not_verified', () => {
    expect(getErrorMessage(t, 'email_not_verified')).toBe('EMAILNOTVERIFIED')
  })

  it('returns TOOMANYREQUESTS for too_many_requests', () => {
    expect(getErrorMessage(t, 'too_many_requests')).toBe('TOOMANYREQUESTS')
  })

  // Registration
  it('returns VALIDATIONERROR for validation_error', () => {
    expect(getErrorMessage(t, 'validation_error')).toBe('VALIDATIONERROR')
  })

  it('returns EMAILALREADYREGISTERED for email_already_registered', () => {
    expect(getErrorMessage(t, 'email_already_registered')).toBe('EMAILALREADYREGISTERED')
  })

  it('returns PASSWORDTOOWEAK for password_too_weak', () => {
    expect(getErrorMessage(t, 'password_too_weak')).toBe('PASSWORDTOOWEAK')
  })

  it('returns CAPTCHAFAILED for captcha_failed', () => {
    expect(getErrorMessage(t, 'captcha_failed')).toBe('CAPTCHAFAILED')
  })

  it('returns CAPTCHAINVALID for captcha_invalid', () => {
    expect(getErrorMessage(t, 'captcha_invalid')).toBe('CAPTCHAINVALID')
  })

  it('returns TERMSNOTACCEPTED for terms_not_accepted', () => {
    expect(getErrorMessage(t, 'terms_not_accepted')).toBe('TERMSNOTACCEPTED')
  })

  // Server / Network
  it('returns INTERNALERROR for internal_error', () => {
    expect(getErrorMessage(t, 'internal_error')).toBe('INTERNALERROR')
  })

  it('returns SERVICEUNAVAILABLE for service_unavailable', () => {
    expect(getErrorMessage(t, 'service_unavailable')).toBe('SERVICEUNAVAILABLE')
  })

  it('returns NETWORKERROR for network_error', () => {
    expect(getErrorMessage(t, 'network_error')).toBe('NETWORKERROR')
  })

  // Fallback
  it('returns GENERICERROR for an unknown code', () => {
    expect(getErrorMessage(t, 'some_random_code')).toBe('GENERICERROR')
  })

  it('returns GENERICERROR when code is undefined', () => {
    expect(getErrorMessage(t)).toBe('GENERICERROR')
  })
})
