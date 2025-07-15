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
 * Custom hook to fetch a paginated, filtered, and sorted list of products.
 *
 * @param filters - The current filter and pagination settings.
 * @param lang    - The language code to send in the Accept-Language header.
 * @returns An object with:
 *   - products:           Array of Product items.
 *   - total:              Total number of matching products.
 *   - loading:            True while the request is in progress.
 *   - error:              Error code if the request fails.
 *   - validationErrors:   Field-specific validation errors (HTTP 422).
 */
export function useProducts(filters: Filters, lang: string) {
  // State for the fetched product list
  const [products, setProducts] = useState<Product[]>([]);
  // State for the total count from the API metadata
  const [total, setTotal] = useState(0);
  // Loading indicator
  const [loading, setLoading] = useState(false);
  // General error code or message
  const [error, setError] = useState<string|null>(null);
  // Validation errors keyed by field name (422 responses)
  const [validationErrors, setValidationErrors] = useState<Record<string,string[]> | null>(null);

  useEffect(() => {
    // Start of request: reset error states and show loader
    setLoading(true);
    setError(null);
    setValidationErrors(null);

    // Map our internal sortBy values to the API's expected sort_by parameter
    const sortMap: Record<Filters['sortBy'], string> = {
      name:  'name',
      price: 'price',
      date:  'product_details->date',
    };

    const apiSort = sortMap[filters.sortBy];

    // Build the query parameters object, omitting empty filters
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

    // Perform the GET request
    axios.get(`${API_BASE_URL}/api/products`, { params, headers: { 'Accept-Language': lang } })
      .then(res => {
        // On success, update state with returned data and total count
        setProducts(res.data.data);
        setTotal(res.data.pagination.total);
      })
      .catch(err => {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 422) {
            // Validation error: capture field errors and stop
          setValidationErrors(err.response!.data.errors as Record<string,string[]>);
          return;
        }
        if (status === 404) {
          // No products found: clear list and total
          setProducts([]);
          setTotal(0);
          return;
        }
      }
      // Other errors: store the error code
      setError(err.code);
    })
    .finally(() => setLoading(false));
  }, [filters, lang]);  // Re-run when filters or language change

  return { products, total, loading, error, validationErrors };
}
