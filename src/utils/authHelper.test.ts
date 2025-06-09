// src/utils/authHelper.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { onLoginSuccess, logout } from './authHelper'
import { useCartStore } from '../stores/useCartStore'
import { useAuthStore } from '../stores/useAuthStore'
import { logoutUser } from '../services/authService'
import { logError } from './logger'

// Mock des modules
vi.mock('../services/authService', () => ({
  logoutUser: vi.fn(),
}))
vi.mock('./logger', () => ({
  logError: vi.fn(),
}))

describe('authHelper', () => {
  let setAuthToken: ReturnType<typeof vi.fn>
  let clearGuestCartIdInStore: ReturnType<typeof vi.fn>
  let loadCart: ReturnType<typeof vi.fn>
  let navigate: ReturnType<typeof vi.fn>
  let clearAuthToken: ReturnType<typeof vi.fn>
  let getStateSpy: ReturnType<typeof vi.spyOn>
  const clearStorageSpy = vi.fn()

  beforeEach(() => {
    // Réinitialise mocks et storages
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()

    setAuthToken = vi.fn()
    clearGuestCartIdInStore = vi.fn()
    loadCart = vi.fn().mockResolvedValue(undefined)
    navigate = vi.fn()
    clearAuthToken = vi.fn()
    useCartStore.persist.clearStorage = clearStorageSpy

    // Spy sur useAuthStore.getState()
    getStateSpy = vi
      .spyOn(useAuthStore, 'getState')
      .mockReturnValue({ authToken: 'TOKEN' } as any)
  })

  afterEach(() => {
    // Restaure le spy
    getStateSpy.mockRestore()
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

      expect(setAuthToken).toHaveBeenCalledWith('TK', false, 'user')
      expect(sessionStorage.getItem('authToken')).toBe('TK')
      expect(sessionStorage.getItem('authRole')).toBe('user')
      expect(localStorage.getItem('authToken')).toBeNull()
      expect(clearGuestCartIdInStore).toHaveBeenCalledWith(null)
      expect(clearStorageSpy).toHaveBeenCalled()
      expect(loadCart).toHaveBeenCalled()
      expect(navigate).toHaveBeenCalledWith('/user/dashboard')
    })

    it('stores token in localStorage when remember=true and navigates by role', async () => {
      await onLoginSuccess('A', 'admin', true, setAuthToken, clearGuestCartIdInStore, loadCart, navigate)
      expect(localStorage.getItem('authToken')).toBe('A')
      expect(localStorage.getItem('authRole')).toBe('admin')
      expect(navigate).toHaveBeenLastCalledWith('/admin/dashboard')

      await onLoginSuccess('E', 'employee', true, setAuthToken, clearGuestCartIdInStore, loadCart, navigate)
      expect(localStorage.getItem('authToken')).toBe('E')
      expect(localStorage.getItem('authRole')).toBe('employee')
      expect(navigate).toHaveBeenLastCalledWith('/employee/dashboard')
    })

    it('redirige vers le nextPath si fourni', async () => {
      // Arrange  
      const customPath = '/mon-chemin';
      // Clear les storage pour être certain
      localStorage.clear();
      sessionStorage.clear();

      // Act  
      await onLoginSuccess(
        'XYZ',                     // token
        'user',                    // rôle
        false,                     // remember
        setAuthToken,
        clearGuestCartIdInStore,
        loadCart,
        navigate,
        customPath                // ← on passe nextPath
      );

      // Assert  
      // On s’attend à ce que navigate ait été appelé UNE SEULE fois, avec customPath
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(customPath);
    });
  })

  describe('logout', () => {
    it('calls logoutUser when there is a token, then clears everything and navigates to default path', async () => {
      // Arrange
      ;(logoutUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 204, data: {} })

      // Act
      await logout(
        clearAuthToken,
        clearGuestCartIdInStore,
        loadCart,
        navigate
      )

      // Assert
      expect(logoutUser).toHaveBeenCalledWith('TOKEN')
      expect(clearAuthToken).toHaveBeenCalled()
      expect(localStorage.getItem('authToken')).toBeNull()
      expect(sessionStorage.getItem('authToken')).toBeNull()
      expect(localStorage.getItem('authRole')).toBeNull()
      expect(sessionStorage.getItem('authRole')).toBeNull()
      expect(clearGuestCartIdInStore).toHaveBeenCalledWith(null)
      expect(clearStorageSpy).toHaveBeenCalled()
      expect(loadCart).toHaveBeenCalled()
      expect(navigate).toHaveBeenCalledWith('/')
    })

    it('logs error and continues when logoutUser rejects', async () => {
      const error = new Error('fail')
      ;(logoutUser as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error)

      await logout(
        clearAuthToken,
        clearGuestCartIdInStore,
        loadCart,
        navigate,
        '/after-fail'
      )

      expect(logError).toHaveBeenCalledWith('logoutUser', error)
      expect(clearAuthToken).toHaveBeenCalled()
      expect(clearGuestCartIdInStore).toHaveBeenCalledWith(null)
      expect(loadCart).toHaveBeenCalled()
      expect(navigate).toHaveBeenCalledWith('/after-fail')
    })

    it('does not call logoutUser if there is no token', async () => {
      getStateSpy.mockReturnValue({ authToken: null } as any)

      await logout(
        clearAuthToken,
        clearGuestCartIdInStore,
        loadCart,
        navigate
      )

      expect(logoutUser).not.toHaveBeenCalled()
      expect(clearAuthToken).toHaveBeenCalled()
      expect(clearGuestCartIdInStore).toHaveBeenCalledWith(null)
      expect(loadCart).toHaveBeenCalled()
      expect(navigate).toHaveBeenCalledWith('/')
    })
  })
})
