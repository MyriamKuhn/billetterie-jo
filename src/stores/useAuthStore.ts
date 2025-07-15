import { create } from 'zustand';

export type UserRole = 'user' | 'admin' | 'employee';

/**
 * Authentication state stored in Zustand.
 */
export interface AuthState {
  /** JWT token, or null if not authenticated */
  authToken: string | null;
  /** User role ('user' | 'admin' | 'employee'), or null if unknown */
  role: UserRole | null;
  /** Whether to persist session across browser restarts */
  remember: boolean;
  /**
   * Set a new authentication token and user role.
   * @param token    The JWT received upon login
   * @param remember If true, store in localStorage; otherwise in sessionStorage
   * @param role     The role associated with this token
   */
  setToken: (token: string, remember: boolean, role: UserRole) => void;
  /** Clear the token and role, and remove from both storages */
  clearToken: () => void;
}

// -----------------------------------------------------------------------------
// Initialize token and role from Web Storage (sessionStorage or localStorage)
// -----------------------------------------------------------------------------

// First try sessionStorage (current session), then localStorage (persistent)
const initialToken =
  sessionStorage.getItem('authToken')
  ?? localStorage.getItem('authToken')
  ?? null;

// Similarly for the role, validating it matches our UserRole type
const initialRoleStr =
  sessionStorage.getItem('authRole')
  ?? localStorage.getItem('authRole')
  ?? null;

const initialRole = (initialRoleStr === 'admin' || initialRoleStr === 'employee' || initialRoleStr === 'user')
  ? (initialRoleStr as UserRole)
  : null;

// If a token exists in localStorage, assume "remember me" was selected
const initialRemember = Boolean(localStorage.getItem('authToken'));

// -----------------------------------------------------------------------------
export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  authToken: initialToken,
  role: initialRole,
  remember: initialRemember,

  /**
   * Update the token, role, and persistence setting.
   * If `remember` is true, store in localStorage for long-term persistence.
   * Otherwise, store in sessionStorage for the current browser session only.
   */
  setToken: (token, remember, role) => {
    set({ authToken: token, remember, role });

    if (remember) {
      // Persist across sessions
      localStorage.setItem('authToken', token);
      localStorage.setItem('authRole', role);
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('authRole');
    } else {
      // Store only for this session
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('authRole', role);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authRole');
    }
  },

  /**
   * Clear the token and role from state and both storage mechanisms.
   * Reset `remember` to false.
   */
  clearToken: () => {
    set({ authToken: null, role: null, remember: false });
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authRole');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
  },
}));

