// src/hooks/useSignupValidation.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSignupValidation, type SignupValidationParams } from './useSignupValidation'
import * as validationUtils from '../utils/validation'

// 1️⃣ On mocke les utilitaires pour piloter leurs retours
vi.mock('../utils/validation', () => ({
  isStrongPassword: vi.fn(),
  isEmailValid: vi.fn(),
}))

describe('useSignupValidation', () => {
  const defaultParams: SignupValidationParams = {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    password: 'Secret123!',
    confirmPassword: 'Secret123!',
    firstnameTouched: false,
    lastnameTouched: false,
    emailTouched: false,
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('ne signale pas d’erreurs de champs quand touched=false', () => {
    // On fait en sorte que les utils renvoient "vrai" pour le mot de passe et l’email
    ;(validationUtils.isStrongPassword as any).mockReturnValue(true)
    ;(validationUtils.isEmailValid as any).mockReturnValue(true)

    const { result } = renderHook(() => useSignupValidation(defaultParams))

    expect(result.current.firstnameError).toBe(false)
    expect(result.current.lastnameError).toBe(false)
    expect(result.current.emailError).toBe(false)

    expect(result.current.isFirstnameValid).toBe(true)
    expect(result.current.isLastnameValid).toBe(true)
    expect(result.current.isEmailValid).toBe(true)

    expect(result.current.pwStrong).toBe(true)
    expect(result.current.pwsMatch).toBe(true)
  })

  it('signale firstnameError quand firstnameTouched=true et firstname vide', () => {
    const params = {
      ...defaultParams,
      firstname: '   ',
      firstnameTouched: true,
    }
    ;(validationUtils.isStrongPassword as any).mockReturnValue(true)
    ;(validationUtils.isEmailValid as any).mockReturnValue(true)

    const { result } = renderHook(() => useSignupValidation(params))

    expect(result.current.firstnameError).toBe(true)
    expect(result.current.isFirstnameValid).toBe(false)
  })

  it('signale lastnameError quand lastnameTouched=true et lastname vide', () => {
    const params = {
      ...defaultParams,
      lastname: '',
      lastnameTouched: true,
    }
    ;(validationUtils.isStrongPassword as any).mockReturnValue(true)
    ;(validationUtils.isEmailValid as any).mockReturnValue(true)

    const { result } = renderHook(() => useSignupValidation(params))

    expect(result.current.lastnameError).toBe(true)
    expect(result.current.isLastnameValid).toBe(false)
  })

  it('signale emailError quand emailTouched=true et email invalide', () => {
    const params = {
      ...defaultParams,
      email: 'not-an-email',
      emailTouched: true,
    }
    ;(validationUtils.isStrongPassword as any).mockReturnValue(true)
    ;(validationUtils.isEmailValid as any).mockReturnValue(false)

    const { result } = renderHook(() => useSignupValidation(params))

    expect(result.current.emailError).toBe(true)
    // isEmailValid renvoyé par l’utilitaire
    expect(result.current.isEmailValid).toBe(false)
  })

  it('detecte un mot de passe faible quand isStrongPassword=false', () => {
    ;(validationUtils.isStrongPassword as any).mockReturnValue(false)
    ;(validationUtils.isEmailValid as any).mockReturnValue(true)

    const { result } = renderHook(() => useSignupValidation(defaultParams))

    expect(result.current.pwStrong).toBe(false)
  })

  it('detecte pwsMatch=false quand confirmPassword différent', () => {
    ;(validationUtils.isStrongPassword as any).mockReturnValue(true)
    ;(validationUtils.isEmailValid as any).mockReturnValue(true)

    const params = {
      ...defaultParams,
      confirmPassword: 'Other123!',
    }

    const { result } = renderHook(() => useSignupValidation(params))

    expect(result.current.pwsMatch).toBe(false)
  })
})
