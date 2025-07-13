import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../stores/useAuthStore';
import { logError } from '../utils/logger';

export function useCreateProduct() {
  const token = useAuthStore(s => s.authToken);
  return async function updateProductDetails(
    body: FormData
  ): Promise<boolean> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/products`,
        body,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
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