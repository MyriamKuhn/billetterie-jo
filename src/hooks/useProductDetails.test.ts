import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import axios from 'axios';
import { useProductDetails } from './useProductDetails';
import { API_BASE_URL } from '../config';
import { vi } from 'vitest';

vi.mock('axios');
vi.mock('../config', () => ({
  __esModule: true,
  API_BASE_URL: 'https://mock-api',
}));

import type { Mock } from 'vitest';
const mockedGet = axios.get as unknown as Mock;
const isAxiosErrorSpy = vi.spyOn(axios, 'isAxiosError');

describe('useProductDetails', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    isAxiosErrorSpy.mockReset();
  });

  it('initial state and handles null productId', async () => {
    const { result } = renderHook(() => useProductDetails(null, 'en'));
    // Immediately after render
    expect(result.current).toEqual({ product: null, loading: false, error: null });
  });

  it('fetch success: sets product and loading false', async () => {
    const fakeProduct = { id: 5, name: 'Test', price: 42 };
    mockedGet.mockResolvedValueOnce({ data: { data: fakeProduct } });

    const { result } = renderHook(() => useProductDetails(5, 'fr'));
    // loading true initially
    expect(result.current.loading).toBe(true);
    expect(result.current.product).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.product).toEqual(fakeProduct);
    expect(result.current.error).toBeNull();

    expect(mockedGet).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/products/5`,
      { headers: { 'Accept-Language': 'fr' } }
    );
  });

  it('handles axios error with response message', async () => {
    isAxiosErrorSpy.mockReturnValue(true);
    const axiosErr = { isAxiosError: true, response: { data: { message: 'Not Found' } } };
    mockedGet.mockRejectedValueOnce(axiosErr);

    const { result } = renderHook(() => useProductDetails(10, 'en'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.product).toBeNull();
    expect(result.current.error).toBe('Not Found');
  });

  it('handles non-axios error fallback to err.message', async () => {
    isAxiosErrorSpy.mockReturnValue(false);
    const genericErr = { message: 'Network Failed' };
    mockedGet.mockRejectedValueOnce(genericErr);

    const { result } = renderHook(() => useProductDetails(7, 'en'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.product).toBeNull();
    expect(result.current.error).toBe('Network Failed');
  });
});
