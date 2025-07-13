import axios from 'axios';
import { useAuthStore, type AuthState } from '../stores/useAuthStore';
import { logError } from '../utils/logger';
import { vi, describe, it, beforeEach } from 'vitest';
import { useCreateEmployee } from './useCreateEmployee';
import { API_BASE_URL } from '../config';

vi.mock('axios');
vi.mock('../stores/useAuthStore');
vi.mock('../utils/logger');

describe('useCreateEmployee', () => {
  const mockToken = 'test-token-123';

  // On crée un AuthState factice conforme
  const fakeAuthState: AuthState = {
    authToken: mockToken,
    role: 'user',          // adapter le type si nécessaire
    remember: false,
    setToken: vi.fn(),
    clearToken: vi.fn(),
  };

  // Définir un body factice pour les tests
  const body = {
    firstname: 'John',
    lastname: 'Doe',
    email: 'test@example.com',
    password: 'password123',
    password_confirmation: 'password123',
  };

  beforeEach(() => {
    // Pour chaque appel useAuthStore(s => s.whatever) on passe fakeAuthState
    vi.mocked(useAuthStore).mockImplementation(selector =>
      selector(fakeAuthState)
    );
    vi.mocked(axios.post).mockReset();
    vi.mocked(logError).mockReset();
  });

  it('should call axios.post with the right URL, headers and return true on success', async () => {
    vi.mocked(axios.post).mockResolvedValue({ status: 201 });

    const createEmployee = useCreateEmployee();
    const result = await createEmployee(body);

    expect(axios.post).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/users/employees`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
      }
    );
    expect(result).toBe(true);
    expect(logError).not.toHaveBeenCalled();
  });

  it('should log the error and return false on failure', async () => {
    const error = new Error('Network failure');
    vi.mocked(axios.post).mockRejectedValue(error);

    const createEmployee = useCreateEmployee();
    const result = await createEmployee(body);

    expect(axios.post).toHaveBeenCalled(); // on s'assure qu'on a bien tenté la requête
    expect(logError).toHaveBeenCalledWith('useCreateEmployee', error);
    expect(result).toBe(false);
  });
});
