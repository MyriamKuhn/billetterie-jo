import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../stores/useAuthStore';
import { logError } from '../utils/logger';

export interface PricingUpdate {
  price: number;
  sale: number;
  stock_quantity: number;
}

/**
 * Hook returning a function to update product pricing.
 * The returned function sends a PATCH request and returns true on success, false on error.
 */
export function useUpdateProductPricing() {
  const token = useAuthStore(s => s.authToken);

  return async function updatePricing(
    productId: number,
    updates: PricingUpdate
  ): Promise<boolean> {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/products/${productId}/pricing`,
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
      logError('useUpdateProductPricing', err);
      return false;
    }
  };
}
