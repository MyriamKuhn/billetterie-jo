// src/utils/authHelper.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { onLoginSuccess, logout } from './authHelper'
import { useCartStore } from '../stores/useCartStore'

describe('authHelper', () => {
  let setAuthToken: ReturnType<typeof vi.fn>
  let clearGuestCartIdInStore: ReturnType<typeof vi.fn>
  let loadCart: ReturnType<typeof vi.fn>
  let navigate: ReturnType<typeof vi.fn>
  let clearAuthToken: ReturnType<typeof vi.fn>
  const clearStorageSpy = vi.fn()

  beforeEach(() => {
    // reset mocks and storages
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()

    setAuthToken = vi.fn()
    clearGuestCartIdInStore = vi.fn()
    loadCart = vi.fn().mockResolvedValue(undefined)
    navigate = vi.fn()
    clearAuthToken = vi.fn()
    // stub the persist.clearStorage
    useCartStore.persist.clearStorage = clearStorageSpy
  })

  describe('onLoginSuccess', () => {
    it('stores token in sessionStorage when remember=false, clears guest cart, loads cart, and navigates to user dashboard', async () => {
      await onLoginSuccess(
        'TK',
        'user',
        false,
        setAuthToken,
        clearGuestCartIdInStore,
        loadCart,
        navigate
      )

      // setAuthToken called
      expect(setAuthToken).toHaveBeenCalledWith('TK', false, 'user')
      // stored in sessionStorage
      expect(sessionStorage.getItem('authToken')).toBe('TK')
      expect(sessionStorage.getItem('authRole')).toBe('user')
      expect(localStorage.getItem('authToken')).toBeNull()
      // guest cart cleared and persistent storage cleared
      expect(clearGuestCartIdInStore).toHaveBeenCalledWith(null)
      expect(clearStorageSpy).toHaveBeenCalled()
      // loadCart called
      expect(loadCart).toHaveBeenCalled()
      // user dashboard
      expect(navigate).toHaveBeenCalledWith('/user/dashboard')
    })

    it('stores token in localStorage when remember=true and navigates by role', async () => {
      // admin
      await onLoginSuccess('A', 'admin', true, setAuthToken, clearGuestCartIdInStore, loadCart, navigate)
      expect(localStorage.getItem('authToken')).toBe('A')
      expect(localStorage.getItem('authRole')).toBe('admin')
      expect(navigate).toHaveBeenLastCalledWith('/admin/dashboard')

      // employee
      await onLoginSuccess('E', 'employee', true, setAuthToken, clearGuestCartIdInStore, loadCart, navigate)
      expect(localStorage.getItem('authToken')).toBe('E')
      expect(localStorage.getItem('authRole')).toBe('employee')
      expect(navigate).toHaveBeenLastCalledWith('/employee/dashboard')
    })
  })

  describe('logout', () => {
    it('clears token storage, clears guest cart, reloads cart, and navigates to default path', async () => {
      await logout(
        clearAuthToken,
        clearGuestCartIdInStore,
        loadCart,
        navigate,
      )

      // clearAuthToken called
      expect(clearAuthToken).toHaveBeenCalled()
      // storages cleared
      expect(localStorage.getItem('authToken')).toBeNull()
      expect(sessionStorage.getItem('authToken')).toBeNull()
      expect(localStorage.getItem('authRole')).toBeNull()
      expect(sessionStorage.getItem('authRole')).toBeNull()
      // guest cart cleared
      expect(clearGuestCartIdInStore).toHaveBeenCalledWith(null)
      expect(clearStorageSpy).toHaveBeenCalled()
      // loadCart called
      expect(loadCart).toHaveBeenCalled()
      // navigates to '/'
      expect(navigate).toHaveBeenCalledWith('/')
    })

    it('navigates to provided redirectPath', async () => {
      await logout(
        clearAuthToken,
        clearGuestCartIdInStore,
        loadCart,
        navigate,
        '/custom'
      )
      expect(navigate).toHaveBeenCalledWith('/custom')
    })
  })
})
