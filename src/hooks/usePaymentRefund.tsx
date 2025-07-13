import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";
import { API_BASE_URL } from "../config";
import { logError } from "../utils/logger";

export interface PaymentRefund {
  amount: number;
}

export function usePaymentRefund() {
  const token = useAuthStore(s => s.authToken);

  return async function refund(
    uuid: string,
    refundData: PaymentRefund
  ): Promise<boolean> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/payments/${uuid}/refund`,
        refundData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return true;
    } catch (err) {
      logError('usePaymentRefund', err);
      return false;
    }
  };
}