import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../stores/useAuthStore';
import { logError } from '../utils/logger';

/**
 * Hook to create a new product via the admin API.
 *
 * Retrieves the current auth token from the store, then returns
 * an async function which sends a multipart/form-data POST request
 * containing the new product details.
 *
 * @returns A function that takes a FormData instance and returns
 *          a Promise resolving to `true` on success or `false` on error.
 */
export function useCreateProduct() {
  // Retrieve the current authentication token
  const token = useAuthStore(s => s.authToken);

  /**
   * Sends the product creation request.
   *
   * @param body  A FormData object including product fields and file(s).
   * @returns     Promise<boolean> indicating whether the request succeeded.
   */
  return async function updateProductDetails(
    body: FormData
  ): Promise<boolean> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/products`,
        body,
        {
          headers: {
            // Required for file uploads
            'Content-Type': 'multipart/form-data',
            // Bearer token for authentication
            Authorization: `Bearer ${token}`
          },
        }
      );
      return true;
    } catch (err) {
      // Log the error for debugging
      logError('useUpdateProductDetails', err);
      return false;
    }
  };
}