import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../stores/useAuthStore';
import { logError } from '../utils/logger';

export interface UserUpdate {
  is_active: boolean;
  twofa_enabled: boolean;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  verify_email: boolean;
}

/**
 * Retourne une fonction updatePricing(productId, updates)
 * qui renvoie true si le patch s'est bien passé (204), false sinon.
 */
export function useUserUpdate() {
  const token = useAuthStore(s => s.authToken);

  return async function updateUser(
    userId: number,
    updates: UserUpdate
  ): Promise<boolean> {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/users/${userId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return true;
    } catch (err) {
      logError('useUserUpdate', err);
      return false;
    }
  };
}
