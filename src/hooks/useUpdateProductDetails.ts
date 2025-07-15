import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../stores/useAuthStore';
import { logError } from '../utils/logger';

/**
 * Hook to upload updated product details to the API.
 */
export function useUpdateProductDetails() {
  const token = useAuthStore(s => s.authToken);

  /**
   * Sends a multipart/form-data request to update a product.
   * @param productId - ID of the product to update.
   * @param body - FormData containing updated product fields and files.
   * @returns true on success, false on failure.
   */
  return async function updateProductDetails(
    productId: number,
    body: FormData
  ): Promise<boolean> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/products/${productId}`,
        body,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return true;
    } catch (err) {
      logError('useUpdateProductDetails', err);
      return false;
    }
  };
}
