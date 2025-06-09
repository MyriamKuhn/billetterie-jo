import { useCartStore } from '../stores/useCartStore';
import type { UserRole } from '../stores/useAuthStore';
import type { NavigateFunction } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { logoutUser } from '../services/authService';
import { logError } from './logger';

/**
 * Stocke le token, recharge le panier invité, puis redirige selon le rôle.
 *
 * @param token          Le JWT renvoyé par l’API.
 * @param role           Le rôle de l’utilisateur ("user" | "admin" | "employee").
 * @param remember       Si true, on stocke en localStorage, sinon en sessionStorage.
 * @param setAuthToken   Fonction de Zustand pour enregistrer le token en mémoire.
 * @param clearGuestCart Id du panier invité à effacer (on passe toujours null ici).
 * @param loadCart       Fonction de Zustand qui recharge le contenu du panier.
 * @param navigate       Callback `useNavigate` pour rediriger l’utilisateur.
 * @param nextPath      (optionnel) chemin vers lequel rediriger l’utilisateur après login.
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
  // 1) Enregistre le token en mémoire (Zustand) et en localStorage/sessionStorage
  setAuthToken(token, remember, role);
  if (remember) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authRole', role);
  } else {
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('authRole', role);
  }

  // 2) Vide le panier invité en store et en stockage persistant
  clearGuestCartIdInStore(null);
  useCartStore.persist.clearStorage();

  // 3) Recharge le panier (maintient la continuité de l’ancien panier si l’utilisateur en avait un)
  await loadCart();

  // 4) si on a un next, on y va, sinon dashboard selon role
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
 * Déconnecte l’utilisateur : révoque le token côté API, efface le token, vide le panier invité,
 * recharge le panier, et navigue.
 *
 * @param clearAuthToken              Fonction de Zustand pour vider le token en mémoire.
 * @param clearGuestCartIdInStore     Fonction de Zustand pour vider l’ID du panier invité.
 * @param loadCart                    Fonction de Zustand pour recharger le panier (après avoir vidé le panier invité).
 * @param navigate                    Fonction `useNavigate()` pour rediriger l’utilisateur.
 * @param redirectPath                (optionnel) chemin vers lequel rediriger l’utilisateur après logout (défaut : '/').
 */
export async function logout(
  clearAuthToken: () => void,
  clearGuestCartIdInStore: (id: string | null) => void,
  loadCart: () => Promise<void>,
  navigate: NavigateFunction,
  redirectPath: string = '/'
) {
  // 1) Récupérer le token et le rôle depuis le store
  const { authToken: token } = useAuthStore.getState();

  // 2) Appel à authService.logoutUser pour révoquer le token
  if (token) {
    try {
      await logoutUser(token);
    } catch (err) {
      logError('logoutUser', err);
    }
  }

  // 3) Vider token et rôle client
  clearAuthToken();
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('authRole');
  sessionStorage.removeItem('authRole');

  // 4) Vider le panier invité (store + persistant)
  clearGuestCartIdInStore(null);
  useCartStore.persist.clearStorage();

  // 5) Recharger le panier (potentiellement vide ou guest différent)
  await loadCart();

  // 6) Redirection
  navigate(redirectPath);
}
