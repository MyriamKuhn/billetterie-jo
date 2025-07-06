import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../stores/useAuthStore';
import { logError } from '../utils/logger';

interface CreateEmployeeBody {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export function useCreateEmployee() {
  const token = useAuthStore(s => s.authToken);
  return async function createEmployee(
    body: CreateEmployeeBody
  ): Promise<boolean> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/users/employees`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        }
      );
      return true;
    } catch (err) {
      logError('useCreateEmployee', err);
      return false;
    }
  };
}