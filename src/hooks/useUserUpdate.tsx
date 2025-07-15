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
 * Returns a function to update a user by ID.
 * Resolves to true if the PATCH succeeds (2xx), false otherwise.
 */
export function useUserUpdate() {
  const token = useAuthStore(s => s.authToken);

  return async function updateUser(
    userId: number,
    updates: UserUpdate
  ): Promise<boolean> {
    try {
      // Send PATCH request to update user details
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
      // Log and swallow errors
      logError('useUserUpdate', err);
      return false;
    }
  };
}
