import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Product } from '../types/products';
import { API_BASE_URL } from '../config';

export interface UseProductDetailsReturn {
  product: Product | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch and manage the state of a single product's details.
 *
 * @param productId - The ID of the product to fetch, or null to skip.
 * @param lang      - The desired language code for the `Accept-Language` header.
 *
 * @returns An object containing:
 *  - product:   The fetched product data, or null if not yet loaded or on error.
 *  - loading:   True while the request is in progress.
 *  - error:     An error message if the fetch failed, or null otherwise.
 */
export function useProductDetails(
  productId: number | null,
  lang: string
): UseProductDetailsReturn {
  // Holds the fetched product data
  const [product, setProduct] = useState<Product | null>(null);
  // Tracks loading state; start as loading only if productId is provided
  const [loading, setLoading] = useState<boolean>(productId != null);
  // Holds any error message from the request
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no productId is given, reset state and exit early
    if (productId == null) {
      setProduct(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Begin new fetch: reset state
    setLoading(true);
    setError(null);
    setProduct(null);

    // Perform GET request to retrieve product details, including language preference
    axios
      .get<{ data: Product }>(
        `${API_BASE_URL}/api/products/${productId}`,
        {
          headers: { 'Accept-Language': lang },
        }
      )
      .then(res => {
        // On success, store the product data
        setProduct(res.data.data);
      })
      .catch(err => {
        // Determine error message: prefer server‑provided message if available
        const msg =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : err.message;
        setError(msg);
      })
      .finally(() => {
        // Always clear loading flag
        setLoading(false);
      });
  }, [productId, lang]);

  return { product, loading, error };
}
