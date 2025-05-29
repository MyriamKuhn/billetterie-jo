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

export function useProducts(filters: Filters, lang: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string,string[]> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setValidationErrors(null);

    // Mapping interne entre notre enum "sortBy" et la clé API
    const sortMap: Record<Filters['sortBy'], string> = {
      name:  'name',
      price: 'price',
      date:  'product_details->date',
    };

    const apiSort = sortMap[filters.sortBy];

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

    axios.get(`${API_BASE_URL}/api/products`, { params, headers: { 'Accept-Language': lang } })
      .then(res => {
        setProducts(res.data.data);
        setTotal(res.data.pagination.total);
      })
      .catch(err => {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 422) {
          setValidationErrors(err.response!.data.errors as Record<string,string[]>);
          return;
        }
        if (status === 404) {
          setProducts([]);
          setTotal(0);
          return;
        }
      }
      setError(err.code);
    })
    .finally(() => setLoading(false));
  }, [filters, lang]);

  return { products, total, loading, error, validationErrors };
}
