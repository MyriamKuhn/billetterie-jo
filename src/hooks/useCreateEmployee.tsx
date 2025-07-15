import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../stores/useAuthStore';
import { logError } from '../utils/logger';

interface CreateEmployeeBody {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/**
 * Hook to create a new employee user via the admin API.
 *
 * Retrieves the current auth token from the store, then returns
 * an async function which sends a POST request with the new employee data.
 *
 * @returns A function that takes the employee data body and returns
 *          a Promise resolving to `true` on success or `false` on error.
 */
export function useCreateEmployee() {
  // Get the current authentication token
  const token = useAuthStore(s => s.authToken);

  /**
   * Creates an employee by calling the admin endpoint.
   *
   * @param body  The payload containing firstname, lastname, email, password, and confirmation.
   * @returns     Promise<boolean> indicating success (true) or failure (false).
   */
  return async function createEmployee(
    body: CreateEmployeeBody
  ): Promise<boolean> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/users/employees`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        }
      );
      return true;
    } catch (err) {
      // Log unexpected errors for debugging
      logError('useCreateEmployee', err);
      return false;
    }
  };
}