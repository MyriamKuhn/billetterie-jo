import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Product } from '../types/products';
import { API_BASE_URL } from '../config';

// Supported language codes
export type LangCode = 'fr' | 'en' | 'de';

export interface UseProductDetailsMultiLangReturn {
  // Mapping from language code to fetched product
  data: Record<LangCode, Product> | null;
  // True while any of the requests is in progress
  loading: boolean;
  // Error message if any request fails
  error: string | null;
}

/**
 * Fetch the same product in multiple languages concurrently.
 *
 * @param productId - The ID of the product to fetch, or null to skip.
 * @param langs     - Array of language codes to fetch (e.g. ['fr','en','de']).
 *
 * @returns An object containing:
 *  - data:    A map of language code → Product, or null if not fetched yet.
 *  - loading: True while any fetch is ongoing.
 *  - error:   Error message if any fetch fails, otherwise null.
 */
export function useProductDetailsMultiLang(
  productId: number | null,
  langs: LangCode[]
): UseProductDetailsMultiLangReturn {
  // Holds the map of results once all requests succeed
  const [data, setData] = useState<Record<LangCode, Product> | null>(null);
  // Tracks if we're currently loading any of the fetches
  const [loading, setLoading] = useState<boolean>(false);
  // Holds a consolidated error message if any fetch fails
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no productId provided, reset state and exit
    if (productId == null) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Begin fetching: reset error and set loading
    setLoading(true);
    setError(null);

    // Fire off concurrent GET requests for each language
    Promise.all(
      langs.map(lang =>
        axios
          .get<{ data: Product }>(`${API_BASE_URL}/api/products/${productId}`, {
            headers: { 'Accept-Language': lang },
          })
          .then(res => res.data.data)
      )
    )
      .then(results => {
        // Build a map: { fr: result0, en: result1, de: result2, ... }
        const map = langs.reduce((acc, lang, i) => {
          acc[lang] = results[i];
          return acc;
        }, {} as Record<LangCode, Product>);
        setData(map);
      })
      .catch(err => {
        // Pick the server‑provided message if available, otherwise fallback to err.message
        const msg =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : err.message;
        setError(msg);
      })
      .finally(() => 
        // Always clear loading flag
        setLoading(false)
      );
  }, [productId, JSON.stringify(langs)]);

  return { data, loading, error };
}
