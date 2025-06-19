import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { createPayment, getPaymentStatus } from './paymentService';

vi.mock('axios');

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createPayment envoie bien le POST et renvoie status + data', async () => {
    // on fait un cast sur le type Mock pour TS
    (axios.post as Mock).mockResolvedValue({
      status: 201,
      data: { data: { uuid: 'u1', client_secret: 'cs1' } },
    });

    const result = await createPayment('cart123', 'tok123', 'fr');

    expect(axios.post).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/payments`,
      { cart_id: 'cart123', payment_method: 'stripe' },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer tok123',
          'Accept-Language': 'fr',
        },
        timeout: 10000,
      }
    );
    expect(result).toEqual({
      status: 201,
      data: { uuid: 'u1', client_secret: 'cs1' },
    });
  });

  it('getPaymentStatus envoie bien le GET et renvoie status + data', async () => {
    (axios.get as Mock).mockResolvedValue({
      status: 200,
      data: { status: 'paid', paid_at: '2025-06-19T12:00:00Z' },
    });

    const result = await getPaymentStatus('uuid123', 'tok456');

    expect(axios.get).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/payments/uuid123`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer tok456',
        },
        timeout: 10000,
      }
    );
    expect(result).toEqual({
      status: 200,
      data: { status: 'paid', paid_at: '2025-06-19T12:00:00Z' },
    });
  });
});
