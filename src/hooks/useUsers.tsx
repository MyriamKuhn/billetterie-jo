import { useState, useEffect } from 'react';
import axios from 'axios';
import type { User } from '../types/user';
import { API_BASE_URL } from '../config';

export interface Filters {
  firstname: string;
  lastname: string;
  email: string;
  role: 'admin' | 'employee' | 'user';
  perPage: number;
  page: number;
}

export function useUsers(
  filters: Omit<Filters, 'role'>,
  token: string,
  forcedRole: Filters['role']
) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string,string[]> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setValidationErrors(null);

    const params: Record<string, any> = {
      per_page: Math.max(1, filters.perPage),
      page: filters.page,
      role: forcedRole,
      ...(filters.firstname && { firstname: filters.firstname     }),
      ...(filters.lastname && { lastname: filters.lastname }),
      ...(filters.email && { email: filters.email }),
    };

    axios.get(`${API_BASE_URL}/api/users`, { params, headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        setUsers(res.data.data.users);
        setTotal(res.data.meta.total);
      })
      .catch(err => {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 422) {
          setValidationErrors(err.response!.data.errors as Record<string,string[]>);
          return;
        }
        if (status === 404) {
          setUsers([]);
          setTotal(0);
          return;
        }
      }
      setError(err.code);
    })
    .finally(() => setLoading(false));
  }, [filters, token, forcedRole]);

  return { users, total, loading, error, validationErrors };
}
