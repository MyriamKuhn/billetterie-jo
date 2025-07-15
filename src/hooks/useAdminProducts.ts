import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Product } from '../types/products';
import { API_BASE_URL } from '../config';

export interface Filters {
  name: string;
  category: string;
  location: string;
  date: string;
  places: number;
  sortBy: 'name' | 'price' | 'date';
  order: 'asc' | 'desc';
  perPage: number;
  page: number;
}

/**
 * Custom hook to fetch and manage a paginated, filtered list of products for admin.
 *
 * @param filters Query filters including search, pagination, and sorting.
 * @param lang    Language code for the Accept-Language header.
 * @param token   Bearer token for API authentication.
 * @returns An object containing:
 *  - products: array of fetched products
 *  - total: total number of matching products
 *  - loading: whether the request is in progress
 *  - error: error code for network or unexpected errors
 *  - validationErrors: server-side validation errors (422)
 */
export function useAdminProducts(filters: Filters, lang: string, token: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string,string[]> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setValidationErrors(null);

    // Map our internal sort field to the API's expected parameter
    const sortMap: Record<Filters['sortBy'], string> = {
      name:  'name',
      price: 'price',
      date:  'product_details->date',
    };

    const apiSort = sortMap[filters.sortBy];

    // Build query parameters, only including non-empty filters
    const params: Record<string, any> = {
      per_page: Math.max(1, filters.perPage),
      page: filters.page,
      sort_by: apiSort,
      order: filters.order,
      ...(filters.name     && { name:     filters.name     }),
      ...(filters.category && { category: filters.category }),
      ...(filters.location && { location: filters.location }),
      ...(filters.date     && { date:     filters.date     }),
      ...(filters.places > 0 && { places: filters.places }),
    };

    axios.get(`${API_BASE_URL}/api/products/all`, { params, headers: { 'Authorization': `Bearer ${token}`, 'Accept-Language': lang } })
      .then(res => {
        // Success: update product list and total count
        setProducts(res.data.data);
        setTotal(res.data.pagination.total);
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
            // No products found for the given filters
            setProducts([]);
            setTotal(0);
            return;
          }
        }
        // Other errors: store the error code
        setError(err.code);
    })
    .finally(() => setLoading(false));
  }, [filters, lang]);

  return { products, total, loading, error, validationErrors };
}
