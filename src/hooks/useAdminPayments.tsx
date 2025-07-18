import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import type { AdminPayments, AdminPaymentsStatus } from '../types/admin';

export interface Filters {
  q:string;
  status: AdminPaymentsStatus;
  payment_method: 'paypal' | 'stripe' | 'free' | '';
  per_page: number;
  page: number;
}

/**
 * Custom hook to fetch and manage a paginated list of payments for admin.
 *
 * @param filters Query filters: search term, status, payment method, pagination.
 * @param token   Bearer token for API authentication.
 * @returns An object containing:
 *  - payments: array of payment records
 *  - total: total number of matching records
 *  - loading: whether the request is in progress
 *  - error: network or unexpected error code
 *  - validationErrors: server-side validation errors (422)
 */
export function useAdminPayments(filters: Filters, token: string) {
  const [payments, setPayments] = useState<AdminPayments[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string,string[]> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setValidationErrors(null);

    // Build query parameters, only including non-empty filters
    const params: Record<string, any> = {
      per_page: Math.max(1, filters.per_page),
      page:    filters.page,
      ...(filters.status          && { status:           filters.status       }),
      ...(filters.payment_method && { payment_method:   filters.payment_method }),
      ...(filters.q         && { q:                filters.q      }),
    };

    axios.get(`${API_BASE_URL}/api/payments`, { params, headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => {
        // Success: update data and total count
        setPayments(res.data.data);
        setTotal(res.data.meta.total);
      })
      .catch(err => {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 422) {
            // Validation errors from server
            setValidationErrors(err.response!.data.errors as Record<string,string[]>);
            return;
          }
          if (status === 404) {
            // No records found
            setPayments([]);
            setTotal(0);
            return;
          }
        }
        // Other errors: store error code
        setError(err.code);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  return { payments, total, loading, error, validationErrors };
}
