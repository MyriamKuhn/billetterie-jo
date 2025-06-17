import axios from 'axios';
import { API_BASE_URL } from '../config';
import type { PaymentInitData, PaymentStatusResponse } from '../types/apiResponse';

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
    { headers, timeout: 10000 },
  );

  return {
    status: response.status,
    data: response.data.data,
  };
}

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
    { headers, timeout: 10000 },
  );

  return {
    status: response.status,
    data: response.data,
  };
}
