import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import type { ReportProductSales } from '../types/admin';

export interface Filters {
  sort_by: 'sales_count';
  sort_order: 'asc' | 'desc';
  per_page: number;
  page: number;
}

/**
 * Custom hook to fetch administrative sales reports for products.
 *
 * @param filters Query parameters for pagination and sorting.
 * @param token   Bearer token for API authentication.
 * @param lang    Language code for the Accept-Language header.
 * @returns An object containing:
 *   - reports: array of fetched sales report entries
 *   - total: total number of matching report entries
 *   - loading: whether the request is in progress
 *   - error: error code for network or unexpected errors
 *   - validationErrors: server-side validation errors (422)
 */
export function useAdminReports(filters: Filters, token: string, lang: string) {
  const [reports, setReports] = useState<ReportProductSales[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string,string[]> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setValidationErrors(null);

    // Build query parameters, enforcing at least 1 item per page
    const params: Record<string, any> = {
      per_page: Math.max(1, filters.per_page),
      page:    filters.page,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
    };

    axios.get(`${API_BASE_URL}/api/tickets/admin/sales`, { params, headers: { 'Authorization': `Bearer ${token}`, 'Accept-Language': lang } })
      .then(res => {
        setReports(res.data.data);
        setTotal(res.data.meta.total);
      })
      .catch(err => {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 422) {
            // Validation errors returned by the API
            setValidationErrors(err.response!.data.errors as Record<string,string[]>);
            return;
          }
          if (status === 404) {
            // No reports found for the given filters
            setReports([]);
            setTotal(0);
            return;
          }
        }
        // Other errors: store the error code
        setError(err.code);
      })
      .finally(() => setLoading(false));
  }, [filters, lang]);

  return { reports, total, loading, error, validationErrors };
}
