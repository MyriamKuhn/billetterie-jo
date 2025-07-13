import { create } from 'zustand';

export type UserRole = 'user' | 'admin' | 'employee';

export interface AuthState {
  authToken: string | null;
  role: UserRole | null;
  remember: boolean;
  setToken: (token: string, remember: boolean, role: UserRole) => void;
  clearToken: () => void;
}

// 1) On essaie d'abord de récupérer le token dans sessionStorage (session en cours),
//    puis dans localStorage (si "remember me" avait été coché), sinon null.
const initialToken =
  sessionStorage.getItem('authToken')
  ?? localStorage.getItem('authToken')
  ?? null;

const initialRoleStr =
  sessionStorage.getItem('authRole')
  ?? localStorage.getItem('authRole')
  ?? null;

// 2) Si on a trouvé un rôle, on l'assigne, sinon null.
const initialRole = (initialRoleStr === 'admin' || initialRoleStr === 'employee' || initialRoleStr === 'user')
  ? (initialRoleStr as UserRole)
  : null;

// 2) Si on l'a trouvé dans localStorage, on considère que "remember" a été coché.
const initialRemember = Boolean(localStorage.getItem('authToken'));

export const useAuthStore = create<AuthState>((set) => ({
  authToken: initialToken,
  role: initialRole,
  remember: initialRemember,

  setToken: (token, remember, role) => {
    set({ authToken: token, remember, role });

    if (remember) {
      // on persiste pour plusieurs jours
      localStorage.setItem('authToken', token);
      localStorage.setItem('authRole', role);
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('authRole');
    } else {
      // on garde juste pour la session en cours
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('authRole', role);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authRole');
    }
  },

  clearToken: () => {
    set({ authToken: null, role: null, remember: false });
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authRole');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
  },
}));

