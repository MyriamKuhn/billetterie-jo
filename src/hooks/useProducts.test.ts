import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import axios from 'axios';
import { useProducts, type Filters } from './useProducts';
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

describe('useProducts', () => {
  const defaultFilters: Filters = {
    name: '',
    category: '',
    location: '',
    date: '',
    places: 0,
    sortBy: 'name',
    order: 'asc',
    perPage: 10,
    page: 2,
  };

  beforeEach(() => {
    mockedGet.mockReset();
    isAxiosErrorSpy.mockReset();
  });

  it('couvre la branche 404 Not Found', async () => {
    // 1️⃣ on entre dans axios.isAxiosError
    isAxiosErrorSpy.mockReturnValue(true);

    // 2️⃣ on rejette avec status = 404
    const error404 = { isAxiosError: true, response: { status: 404 } };
    mockedGet.mockRejectedValueOnce(error404);

    // 3️⃣ on monte le hook
    const { result } = renderHook(() => useProducts(defaultFilters, 'en'));

    // 4️⃣ on attend la fin du loading
    await waitFor(() => expect(result.current.loading).toBe(false));

    // 5️⃣ assertions pour la branche 404
    expect(result.current.products).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.validationErrors).toBeNull();
  });

  it('fetch succès : remplit products et total, met loading false', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], pagination: { total: 5 } },
    });

    const { result } = renderHook(() => useProducts(defaultFilters, 'fr'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.products).toEqual([{ id: 1 }]);
    expect(result.current.total).toBe(5);
    expect(result.current.error).toBeNull();
    expect(result.current.validationErrors).toBeNull();

    expect(mockedGet).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/products`,
      {
        params: {
          per_page: 10,
          page: 2,
          sort_by: 'name',
          order: 'asc',
        },
        headers: { 'Accept-Language': 'fr' },
      }
    );
  });

  it('422 ValidationError: setValidationErrors et stop', async () => {
    isAxiosErrorSpy.mockReturnValue(true);
    const axiosErr = {
      isAxiosError: true,
      response: { status: 422, data: { errors: { name: ['required'] } } },
    };
    mockedGet.mockRejectedValueOnce(axiosErr);

    const { result } = renderHook(() => useProducts(defaultFilters, 'en'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.validationErrors).toEqual({ name: ['required'] });
    expect(result.current.error).toBeNull();
  });

  it('404 Not Found branch: axios.isAxiosError && status=404', async () => {
    // Couvre if (status === 404)
    isAxiosErrorSpy.mockReturnValue(true);
    const axiosErr = { isAxiosError: true, response: { status: 404 } };
    mockedGet.mockRejectedValueOnce(axiosErr);

    const { result } = renderHook(() => useProducts(defaultFilters, 'en'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.products).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.validationErrors).toBeNull();
  });

  it('erreur générique: setError err.code', async () => {
    const genericErr = { message: 'fail', code: 'ECONN', isAxiosError: false };
    mockedGet.mockRejectedValueOnce(genericErr);

    const { result } = renderHook(() => useProducts(defaultFilters, 'en'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('ECONN');
    expect(result.current.validationErrors).toBeNull();
  });

  it('perPage < 1 devient per_page=1', async () => {
    const filters = { ...defaultFilters, perPage: 0 };
    mockedGet.mockResolvedValueOnce({
      data: { data: [], pagination: { total: 0 } },
    });

    const { result } = renderHook(() => useProducts(filters, 'en'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGet).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/products`,
      expect.objectContaining({
        params: expect.objectContaining({ per_page: 1 }),
      })
    );
  });

  it('inclut tous les filtres non vides dans params', async () => {
    const filters: Filters = {
      name: 'a',
      category: 'b',
      location: 'c',
      date: '2025-01-01',
      places: 3,
      sortBy: 'date',
      order: 'desc',
      perPage: 5,
      page: 1,
    };
    mockedGet.mockResolvedValueOnce({
      data: { data: [], pagination: { total: 0 } },
    });

    const { result } = renderHook(() => useProducts(filters, 'de'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGet).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/products`,
      {
        params: {
          per_page: 5,
          page: 1,
          sort_by: 'product_details->date',
          order: 'desc',
          name: 'a',
          category: 'b',
          location: 'c',
          date: '2025-01-01',
          places: 3,
        },
        headers: { 'Accept-Language': 'de' },
      }
    );
  });

  it('mapping sortBy="price" génère sort_by=price dans les params', async () => {
    const filtersWithPrice: Filters = {
      ...defaultFilters,
      sortBy: 'price',
      order: 'desc',
      perPage: 5,
      page: 3,
    };
    mockedGet.mockResolvedValueOnce({
      data: { data: [], pagination: { total: 0 } },
    });

    const { result } = renderHook(() => useProducts(filtersWithPrice, 'es'));
    // on attend la fin du chargement
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGet).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/products`,
      {
        params: {
          per_page: 5,
          page: 3,
          sort_by: 'price',       // <-- couverture du mapping "price"
          order: 'desc',
        },
        headers: { 'Accept-Language': 'es' },
      }
    );
  });

  it('axios error non-422/404 (status 500) déclenche setError(err.code)', async () => {
    // on fait croire que c’est une AxiosError
    isAxiosErrorSpy.mockReturnValue(true);
    const axiosErr500 = {
      isAxiosError: true,
      response: { status: 500 },
      code: 'E500',
    };
    mockedGet.mockRejectedValueOnce(axiosErr500);

    const { result } = renderHook(() => useProducts(defaultFilters, 'it'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // on doit avoir récupéré le code d’erreur dans error
    expect(result.current.error).toBe('E500');
    expect(result.current.validationErrors).toBeNull();
    // products et total restent aux valeurs par défaut
    expect(result.current.products).toEqual([]);
    expect(result.current.total).toBe(0);
  });
});
