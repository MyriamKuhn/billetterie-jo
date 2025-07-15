import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";
import { API_BASE_URL } from "../config";
import { logError } from "../utils/logger";

export interface PaymentRefund {
  amount: number;
}

/**
 * Hook providing a function to refund a payment by its UUID.
 *
 * Usage:
 * const refundPayment = usePaymentRefund();
 * const success = await refundPayment(paymentUuid, { amount: 100 });
 *
 * @returns A function (uuid, refundData) => Promise<boolean>
 *   - Returns true if the refund request succeeded.
 *   - Returns false if any error occurred.
 */
export function usePaymentRefund() {
  const token = useAuthStore(s => s.authToken);

  return async function refund(
    uuid: string,
    refundData: PaymentRefund
  ): Promise<boolean> {
    try {
      // Send POST request to issue a refund for the given payment UUID
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
      // Log error for debugging purposes
      logError('usePaymentRefund', err);
      return false;
    }
  };
}