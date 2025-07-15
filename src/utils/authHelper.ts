import { useCartStore } from '../stores/useCartStore';
import type { UserRole } from '../stores/useAuthStore';
import type { NavigateFunction } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { logoutUser } from '../services/authService';
import { logError } from './logger';

/**
 * Handle successful login:
 * 1. Store JWT and user role in Zustand and in session/local storage.
 * 2. Clear any existing guest cart ID from store and persistent storage.
 * 3. Reload the cart (will merge any existing server‑side cart).
 * 4. Redirect user: use `nextPath` if provided, otherwise send to dashboard based on role.
 *
 * @param token                        JWT returned by the API.
 * @param role                         The user's role ("user" | "admin" | "employee").
 * @param remember                     If true, persist token in localStorage; otherwise sessionStorage.
 * @param setAuthToken                 Zustand setter to register token and role in memory.
 * @param clearGuestCartIdInStore      Zustand setter to clear guest cart ID.
 * @param loadCart                     Zustand action to reload cart contents.
 * @param navigate                     React Router navigation function.
 * @param nextPath                     Optional path to redirect to after login.
 */
export async function onLoginSuccess(
  token: string,
  role: UserRole,
  remember: boolean,
  setAuthToken: (token: string, remember: boolean, role: UserRole) => void,
  clearGuestCartIdInStore: (id: string | null) => void,
  loadCart: () => Promise<void>,
  navigate: (path: string) => void,
  nextPath?: string
) {
  // Store token & role in Zustand and in browser storage
  setAuthToken(token, remember, role);
  if (remember) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authRole', role);
  } else {
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('authRole', role);
  }

  // Clear any guest cart ID and its persisted storage
  clearGuestCartIdInStore(null);
  useCartStore.persist.clearStorage();

  // Reload cart (will fetch user cart or preserve existing server cart)
  await loadCart();

  // Redirect to desired location or appropriate dashboard
  if (nextPath) {
    navigate(nextPath);
  } else if (role === 'admin') {
    navigate('/admin/dashboard');
  } else if (role === 'employee') {
    navigate('/employee/dashboard');
  } else {
    navigate('/user/dashboard');
  }
}

/**
 * Log out the user:
 * 1. Revoke the JWT via API.
 * 2. Clear token and role from Zustand and browser storage.
 * 3. Clear any guest cart ID and its persisted storage.
 * 4. Reload cart (now as a guest).
 * 5. Redirect to the given path.
 *
 * @param clearAuthToken               Zustand setter to clear authToken & role from memory.
 * @param clearGuestCartIdInStore      Zustand setter to clear guest cart ID.
 * @param loadCart                     Zustand action to reload cart contents.
 * @param navigate                     React Router navigation function.
 * @param redirectPath                 Path to redirect to after logout (default "/").
 */
export async function logout(
  clearAuthToken: () => void,
  clearGuestCartIdInStore: (id: string | null) => void,
  loadCart: () => Promise<void>,
  navigate: NavigateFunction,
  redirectPath: string = '/'
) {
  // Retrieve the current token
  const { authToken: token } = useAuthStore.getState();

  // Attempt to revoke the token on the server
  if (token) {
    try {
      await logoutUser(token);
    } catch (err) {
      logError('logoutUser', err);
    }
  }

  // Clear token and role from Zustand and browser storage
  clearAuthToken();
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('authRole');
  sessionStorage.removeItem('authRole');

  // Clear any guest cart ID and its persisted storage
  clearGuestCartIdInStore(null);
  useCartStore.persist.clearStorage();

  // Reload cart as a guest (should be empty or default)
  await loadCart();

  // Redirect to the specified path
  navigate(redirectPath);
}
