import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import type { TicketStatus } from '../types/tickets';
import type { AdminTicket } from '../types/admin';

export interface Filters {
  status: TicketStatus;
  user_id?: number;
  per_page: number;
  page: number;
}

export function useAdminTickets(filters: Filters, token: string) {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string,string[]> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setValidationErrors(null);

    const params: Record<string, any> = {
      per_page: Math.max(1, filters.per_page),
      page:    filters.page,
      ...(filters.status          && { status:           filters.status       }),
      ...(filters.user_id         && { user_id:          filters.user_id       }),
    };

    axios.get(`${API_BASE_URL}/api/tickets`, { params, headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => {
        setTickets(res.data.data);
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
          setTickets([]);
          setTotal(0);
          return;
        }
      }
      setError(err.code);
    })
    .finally(() => setLoading(false));
  }, [filters]);

  return { tickets, total, loading, error, validationErrors };
}
