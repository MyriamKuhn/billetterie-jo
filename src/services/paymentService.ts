import axios from 'axios';
import { API_BASE_URL } from '../config';
import type { PaymentInitData, PaymentStatusResponse } from '../types/apiResponse';

/**
 * Creates a new payment intent for the given cart via Stripe.
 *
 * @param cart_id  Unique identifier of the cart to pay for.
 * @param token    Bearer token for user authentication.
 * @param lang     Language code to send in the Accept-Language header.
 * @returns        An object containing the HTTP status and the payment initialization data,
 *                 including the Stripe client secret and server‑side UUID.
 * @throws         If the network request fails or times out.
 */
export async function createPayment(
  cart_id: string, 
  token: string, 
  lang: string,
): Promise<{ status: number; data: PaymentInitData }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Accept-Language': lang
  };

  const response = await axios.post<{ data: PaymentInitData }>(
    `${API_BASE_URL}/api/payments`,
    { cart_id, payment_method: 'stripe' },
    { headers, timeout: 10000 }, // 10 seconds
  );

  return {
    status: response.status,
    data: response.data.data,
  };
}

/**
 * Retrieves the current status of an in‑progress payment.
 *
 * @param uuid   Server‑side identifier for the payment intent.
 * @param token  Bearer token for user authentication.
 * @returns      An object containing the HTTP status and the payment status response,
 *               which includes fields like `status`, `amount`, etc.
 * @throws       If the network request fails or times out.
 */
export async function getPaymentStatus(
  uuid: string,
  token: string,
): Promise<{ status: number; data: PaymentStatusResponse }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const response = await axios.get<PaymentStatusResponse>(
    `${API_BASE_URL}/api/payments/${uuid}`,
    { headers, timeout: 10000 }, // 10 seconds
  );

  return {
    status: response.status,
    data: response.data,
  };
}
