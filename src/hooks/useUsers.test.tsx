import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { useUsers, type Filters } from './useUsers';
import { API_BASE_URL } from '../config';

vi.mock('axios');

describe('useUsers hook', () => {
  const token = 'token-abc';
  const forcedRole: Filters['role'] = 'user';
  const baseFilters: Omit<Filters, 'role'> = {
    firstname: '',
    lastname: '',
    email: '',
    perPage: 5,
    page: 1,
  };

  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
    vi.mocked(axios.isAxiosError).mockReset();
  });

  it('fetches data successfully', async () => {
    const users = [{ id: 1, firstname: 'Alice', lastname: 'Dupont', email: 'a@e', role: 'user', is_active: true, twofa_enabled: false, verify_email: true }];
    const total = 42;
    vi.mocked(axios.get).mockResolvedValue({
      data: { data: { users }, meta: { total } }
    });

    const { result } = renderHook(() =>
      useUsers(baseFilters, token, forcedRole)
    );

    // loading commence à true
    expect(result.current.loading).toBe(true);

    // on attend que loading passe à false
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(axios.get).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/users`,
      {
        params: { per_page: 5, page: 1, role: forcedRole },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    expect(result.current.users).toEqual(users);
    expect(result.current.total).toBe(total);
    expect(result.current.error).toBeNull();
    expect(result.current.validationErrors).toBeNull();
  });

  it('handles 422 validation errors', async () => {
    const errors = { firstname: ['required'] };
    const err: any = {
      code: 'ERR_BAD_REQUEST',
      response: { status: 422, data: { errors } }
    };
    vi.mocked(axios.get).mockRejectedValue(err);
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    const { result } = renderHook(() =>
      useUsers(baseFilters, token, forcedRole)
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.validationErrors).toEqual(errors);
    expect(result.current.error).toBeNull();
    expect(result.current.users).toEqual([]);      // toujours le tableau initial vide
    expect(result.current.total).toBe(0);          // idem pour total
  });

  it('handles 404 not found by resetting users/total', async () => {
    const err: any = {
      code: 'ERR_NOT_FOUND',
      response: { status: 404 }
    };
    vi.mocked(axios.get).mockRejectedValue(err);
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    const { result } = renderHook(() =>
      useUsers(baseFilters, token, forcedRole)
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.validationErrors).toBeNull();
  });

  it('handles other axios errors by setting error code', async () => {
    const err: any = {
      code: 'ERR_NETWORK',
      response: { status: 500 },
    };
    vi.mocked(axios.get).mockRejectedValue(err);
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    const { result } = renderHook(() =>
      useUsers(baseFilters, token, forcedRole)
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('ERR_NETWORK');
    expect(result.current.validationErrors).toBeNull();
  });

  it('handles non-axios errors by setting error code', async () => {
    const err = new Error('Boom');
    vi.mocked(axios.get).mockRejectedValue(err);
    vi.mocked(axios.isAxiosError).mockReturnValue(false);

    const { result } = renderHook(() =>
      useUsers(baseFilters, token, forcedRole)
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // @ts-ignore: dans le hook on fait err.code, donc on vérifie ça
    expect(result.current.error).toBe((err as any).code);
  });

  it('includes firstname, lastname and email in the request params when provided', async () => {
    // on simule une réponse vide pour ne pas polluer les assertions
    vi.mocked(axios.get).mockResolvedValue({
      data: { data: { users: [] }, meta: { total: 0 } }
    });

    // on fournit tous les filtres optionnels
    const filtersWithExtras: Omit<Filters, 'role'> = {
      perPage: 10,
      page: 2,
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe@example.com',
    };

    const { result } = renderHook(() =>
      useUsers(filtersWithExtras, token, forcedRole)
    );

    // on attend la fin du chargement
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(axios.get).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/users`,
      {
        params: {
          per_page: 10,
          page: 2,
          role: forcedRole,
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
        },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    // vérifie toujours l'état final
    expect(result.current.users).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.validationErrors).toBeNull();
  });
});
