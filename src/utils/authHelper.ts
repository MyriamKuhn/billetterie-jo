import { useCartStore } from '../stores/useCartStore';
import type { UserRole } from '../stores/useAuthStore';
import type { NavigateFunction } from 'react-router-dom';

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
 */
export async function onLoginSuccess(
  token: string,
  role: UserRole,
  remember: boolean,
  setAuthToken: (token: string, remember: boolean, role: UserRole) => void,
  clearGuestCartIdInStore: (id: string | null) => void,
  loadCart: () => Promise<void>,
  navigate: (path: string) => void
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

  // 4) Redirection selon le rôle
  if (role === 'admin') {
    navigate('/admin/dashboard');
  } else if (role === 'employee') {
    navigate('/employee/dashboard');
  } else {
    navigate('/user/dashboard');
  }
}

  /**
 * Déconnecte l’utilisateur : efface le token, vide le panier invité, recharge le panier, et navigue.
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
  // 1) Vider le token du store + session/localStorage
  clearAuthToken();
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('authRole');
  sessionStorage.removeItem('authRole');

  // 2) Vider le panier invité (store + storage persistant)
  clearGuestCartIdInStore(null);
  useCartStore.persist.clearStorage();

  // 3) Recharger le panier (pour éventuellement afficher un panier “vide” ou un panier de guest différent)
  await loadCart();

  // 4) Redirection vers la page souhaitée (par défaut, la page d’accueil)
  navigate(redirectPath);
}
