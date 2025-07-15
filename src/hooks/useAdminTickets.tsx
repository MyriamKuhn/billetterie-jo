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

/**
 * Fetches tickets for admin view with pagination, filtering by status and optional user.
 *
 * @param filters Query settings: status, optional user_id, per_page, page.
 * @param token   Bearer token for authentication.
 * @returns An object containing:
 *   - tickets: list of retrieved AdminTicket objects
 *   - total: total count of matching tickets
 *   - loading: true while request is in progress
 *   - error: error code on failure
 *   - validationErrors: field-specific validation errors (HTTP 422)
 */
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

    // Build request query parameters
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
            // Validation errors from the API
            setValidationErrors(err.response!.data.errors as Record<string,string[]>);
            return;
          }
          if (status === 404) {
            // No tickets found
            setTickets([]);
            setTotal(0);
            return;
          }
        }
        // Other errors (network, unexpected)
        setError(err.code);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  return { tickets, total, loading, error, validationErrors };
}
