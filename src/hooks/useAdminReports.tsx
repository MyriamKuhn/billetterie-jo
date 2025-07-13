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
          setValidationErrors(err.response!.data.errors as Record<string,string[]>);
          return;
        }
        if (status === 404) {
          setReports([]);
          setTotal(0);
          return;
        }
      }
      setError(err.code);
    })
    .finally(() => setLoading(false));
  }, [filters, lang]);

  return { reports, total, loading, error, validationErrors };
}
