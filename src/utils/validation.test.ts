// src/utils/validation.test.ts
import { describe, it, expect } from 'vitest'
import { isStrongPassword, isEmailValid } from './validation'

describe('isStrongPassword', () => {
  it('renvoie true pour un mot de passe fort (>=15 chars, maj, min, chiffre, spécial)', () => {
    const pw = 'Abcd1234!@#$%^&*'  // 16 caractères, contient tout
    expect(isStrongPassword(pw)).toBe(true)
  })

  it('renvoie false si trop court (<15)', () => {
    const pw = 'Ab1!aA2@bB3'  // seulement 11 caractères
    expect(isStrongPassword(pw)).toBe(false)
  })

  it('renvoie false sans lettre majuscule', () => {
    const pw = 'abcd1234!@#$%^&*'  // pas de majuscule
    expect(isStrongPassword(pw)).toBe(false)
  })

  it('renvoie false sans lettre minuscule', () => {
    const pw = 'ABCD1234!@#$%^&*'  // pas de minuscule
    expect(isStrongPassword(pw)).toBe(false)
  })

  it('renvoie false sans chiffre', () => {
    const pw = 'Abcd!@#$%^&*()-+_'  // pas de chiffre
    expect(isStrongPassword(pw)).toBe(false)
  })

  it('renvoie false sans caractère spécial', () => {
    const pw = 'Abcd1234Efgh5678'  // pas de caractère non-alphanumérique
    expect(isStrongPassword(pw)).toBe(false)
  })
})

describe('isEmailValid', () => {
  it('renvoie true pour une adresse email valide simple', () => {
    expect(isEmailValid('test@example.com')).toBe(true)
  })

  it('renvoie true pour une adresse avec sous-domaine et tiret', () => {
    expect(isEmailValid('user.name-123@sub.domain.co')).toBe(true)
  })

  it('renvoie false sans arobase', () => {
    expect(isEmailValid('test.example.com')).toBe(false)
  })

  it('renvoie false sans nom de domaine valide', () => {
    expect(isEmailValid('test@.com')).toBe(false)
  })

  it('renvoie false si le TLD est trop court (<2)', () => {
    expect(isEmailValid('test@example.c')).toBe(false)
  })

  it('renvoie false avec caractères invalides', () => {
    expect(isEmailValid('te st@exa mple.com')).toBe(false)
  })
})
