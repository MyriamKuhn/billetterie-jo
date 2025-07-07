import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore, type AuthState } from '../stores/useAuthStore';
import { logError } from '../utils/logger';
import { useUserUpdate, type UserUpdate } from './useUserUpdate';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('axios');
vi.mock('../stores/useAuthStore');
vi.mock('../utils/logger');

describe('useUserUpdate', () => {
  const mockToken = 'test-token-456';
  const fakeAuthState: AuthState = {
    authToken: mockToken,
    role: 'admin',
    remember: false,
    setToken: vi.fn(),
    clearToken: vi.fn(),
  };

  const userId = 42;
  const updates: UserUpdate = {
    is_active: true,
    twofa_enabled: false,
    firstname: 'Alice',
    lastname: 'Smith',
    email: 'alice.smith@example.com',
    role: 'user',
    verify_email: true,
  };

  beforeEach(() => {
    // on mock la récupération du token
    vi.mocked(useAuthStore).mockImplementation(selector =>
      selector(fakeAuthState)
    );
    vi.mocked(axios.patch).mockReset();
    vi.mocked(logError).mockReset();
  });

  it('should call axios.patch with correct URL, body and headers and return true on success', async () => {
    vi.mocked(axios.patch).mockResolvedValue({ status: 204 });

    const updateUser = useUserUpdate();
    const result = await updateUser(userId, updates);

    expect(axios.patch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/users/${userId}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    expect(result).toBe(true);
    expect(logError).not.toHaveBeenCalled();
  });

  it('should log the error and return false on failure', async () => {
    const error = new Error('Patch failed');
    vi.mocked(axios.patch).mockRejectedValue(error);

    const updateUser = useUserUpdate();
    const result = await updateUser(userId, updates);

    expect(axios.patch).toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith('useUserUpdate', error);
    expect(result).toBe(false);
  });
});
