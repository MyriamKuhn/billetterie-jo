import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Product } from '../types/products';
import { API_BASE_URL } from '../config';

export type LangCode = 'fr' | 'en' | 'de';

export interface UseProductDetailsMultiLangReturn {
  data: Record<LangCode, Product> | null;
  loading: boolean;
  error: string | null;
}

export function useProductDetailsMultiLang(
  productId: number | null,
  langs: LangCode[]
): UseProductDetailsMultiLangReturn {
  const [data, setData] = useState<Record<LangCode, Product> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId == null) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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
        // Construire un objet { fr:…, en:…, de:… }
        const map = langs.reduce((acc, lang, i) => {
          acc[lang] = results[i];
          return acc;
        }, {} as Record<LangCode, Product>);
        setData(map);
      })
      .catch(err => {
        const msg =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : err.message;
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [productId, JSON.stringify(langs)]);

  return { data, loading, error };
}
