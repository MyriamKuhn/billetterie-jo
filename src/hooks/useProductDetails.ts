import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Product } from '../types/products';
import { API_BASE_URL } from '../config';

export interface UseProductDetailsReturn {
  product: Product | null;
  loading: boolean;
  error: string | null;
}

export function useProductDetails(
  productId: number | null,
  lang: string
): UseProductDetailsReturn {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId == null) {
      setProduct(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setProduct(null);

    axios
      .get<{ data: Product }>(
        `${API_BASE_URL}/api/products/${productId}`,
        {
          headers: { 'Accept-Language': lang },
        }
      )
      .then(res => {
        setProduct(res.data.data);
      })
      .catch(err => {
        const msg =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : err.message;
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId, lang]);

  return { product, loading, error };
}
