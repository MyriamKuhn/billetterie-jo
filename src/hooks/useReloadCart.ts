import { useState, useEffect, useCallback, useRef } from 'react';
import { useCartStore } from '../stores/cartStore';
import { useLanguageStore } from '../stores/useLanguageStore';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';
import { useCustomSnackbar } from './useCustomSnackbar';

export function useReloadCart() {
  const loadCart = useCartStore(s => s.loadCart);
  const { notify } = useCustomSnackbar();
  const { t } = useTranslation('cart');
  const lang = useLanguageStore(s => s.lang);

  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  // AbortController pour annuler les vieux appels
  const abortCtrlRef = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    setIsReloading(true);

    // on annule l'appel précédent
    abortCtrlRef.current?.abort();
    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;

    setHasError(false);
    setLoading(true);
    try {
      await loadCart();
    } catch (err: unknown) {
      if ((err as AxiosError).code !== 'ERR_CANCELED') {
        setHasError(true);

        const code = (err as AxiosError).response?.status;
        const message =
          code === 404
            ? t('errors.error_not_found')
            : t('errors.error_load');

        notify(message, 'error');
      }
    } finally {
      setLoading(false);
      setIsReloading(false);
    }
  }, [loadCart, notify, t]);

  // auto-reload à chaque changement de langue
  useEffect(() => {
    reload();
    if (!loading) setIsReloading(false);
  }, [reload, lang]);

  return { loading, hasError, isReloading, reload };
}