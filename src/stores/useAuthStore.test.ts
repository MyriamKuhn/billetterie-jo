// src/stores/useAuthStore.test.ts
import { describe, it, expect, vi } from 'vitest'

const STORE_PATH = './useAuthStore'

describe('useAuthStore – initial state', () => {
  it('should start with nulls when no storage', async () => {
    vi.resetModules()
    sessionStorage.clear()
    localStorage.clear()
    const { useAuthStore } = await import(STORE_PATH)
    const state = useAuthStore.getState()
    expect(state.authToken).toBeNull()
    expect(state.role).toBeNull()
    expect(state.remember).toBe(false)
  })

  it('should read from sessionStorage when present', async () => {
    vi.resetModules()
    sessionStorage.clear()
    localStorage.clear()
    sessionStorage.setItem('authToken', 'sessTok')
    sessionStorage.setItem('authRole', 'employee')
    const { useAuthStore } = await import(STORE_PATH)
    const state = useAuthStore.getState()
    expect(state.authToken).toBe('sessTok')
    expect(state.role).toBe('employee')
    expect(state.remember).toBe(false)
  })

  it('should read from localStorage and set remember=true when sessionStorage empty', async () => {
    vi.resetModules()
    sessionStorage.clear()
    localStorage.clear()
    localStorage.setItem('authToken', 'localTok')
    localStorage.setItem('authRole', 'admin')
    const { useAuthStore } = await import(STORE_PATH)
    const state = useAuthStore.getState()
    expect(state.authToken).toBe('localTok')
    expect(state.role).toBe('admin')
    expect(state.remember).toBe(true)
  })
})

describe('useAuthStore – mutations', () => {
  it('setToken remembers in localStorage when remember=true', async () => {
    vi.resetModules()
    sessionStorage.clear()
    localStorage.clear()
    const { useAuthStore } = await import(STORE_PATH)
    // call setToken
    useAuthStore.getState().setToken('abc', true, 'user')
    // state updated
    const s1 = useAuthStore.getState()
    expect(s1.authToken).toBe('abc')
    expect(s1.role).toBe('user')
    expect(s1.remember).toBe(true)
    // storage updated
    expect(localStorage.getItem('authToken')).toBe('abc')
    expect(localStorage.getItem('authRole')).toBe('user')
    expect(sessionStorage.getItem('authToken')).toBeNull()
    expect(sessionStorage.getItem('authRole')).toBeNull()
  })

  it('setToken stores in sessionStorage when remember=false', async () => {
    vi.resetModules()
    sessionStorage.clear()
    localStorage.clear()
    const { useAuthStore } = await import(STORE_PATH)
    useAuthStore.getState().setToken('xyz', false, 'admin')
    const s2 = useAuthStore.getState()
    expect(s2.authToken).toBe('xyz')
    expect(s2.role).toBe('admin')
    expect(s2.remember).toBe(false)
    expect(sessionStorage.getItem('authToken')).toBe('xyz')
    expect(sessionStorage.getItem('authRole')).toBe('admin')
    expect(localStorage.getItem('authToken')).toBeNull()
    expect(localStorage.getItem('authRole')).toBeNull()
  })

  it('clearToken resets state and clears both storages', async () => {
    vi.resetModules()
    sessionStorage.clear()
    localStorage.clear()
    // pre-populate storage
    sessionStorage.setItem('authToken', 'old')
    localStorage.setItem('authRole', 'user')
    const { useAuthStore } = await import(STORE_PATH)
    // first set a value
    useAuthStore.getState().setToken('foo', true, 'employee')
    // then clear
    useAuthStore.getState().clearToken()
    const s3 = useAuthStore.getState()
    expect(s3.authToken).toBeNull()
    expect(s3.role).toBeNull()
    expect(s3.remember).toBe(false)
    expect(sessionStorage.getItem('authToken')).toBeNull()
    expect(sessionStorage.getItem('authRole')).toBeNull()
    expect(localStorage.getItem('authToken')).toBeNull()
    expect(localStorage.getItem('authRole')).toBeNull()
  })
})
