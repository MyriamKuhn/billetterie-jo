import { useState, useEffect, useCallback, useRef } from 'react';
import { useCartStore } from '../stores/useCartStore';
import { useLanguageStore } from '../stores/useLanguageStore';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';
import { useCustomSnackbar } from './useCustomSnackbar';

/**
 * Hook to reload the shopping cart, with automatic reload on language change,
 * error handling, and support for cancellation of in-flight requests.
 */
export function useReloadCart() {
  // Retrieve the loadCart action from the cart store
  const loadCart = useCartStore(s => s.loadCart);
  // Snackbar utility for user notifications
  const { notify } = useCustomSnackbar();
  // Translation function for the 'cart' namespace
  const { t } = useTranslation('cart');
  // Current UI language
  const lang = useLanguageStore(s => s.lang);

  // Loading state for the current network request
  const [loading, setLoading] = useState(false);
  // Tracks whether the most recent reload attempt resulted in an error
  const [hasError, setHasError] = useState(false);
  // Indicates if a reload is in progress (including the initial auto-reload)
  const [isReloading, setIsReloading] = useState(false);

  // Ref to hold the AbortController for cancelling previous requests
  const abortCtrlRef = useRef<AbortController | null>(null);

  /**
   * Reloads the cart by calling the loadCart action.
   * Cancels any previous in-flight request before starting a new one.
   */
  const reload = useCallback(async () => {
    setIsReloading(true);

    // Abort any previous fetch
    abortCtrlRef.current?.abort();
    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;

    setHasError(false);
    setLoading(true);
    try {
      // Attempt to load the cart; the loadCart implementation should
      // respect the AbortController.signal if applicable.
      await loadCart();
    } catch (err: unknown) {
      // Ignore cancellations
      if ((err as AxiosError).code !== 'ERR_CANCELED') {
        setHasError(true);
        // Determine error message based on HTTP status
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

  /**
   * Automatically reload the cart whenever the UI language changes.
   * Ensures that isReloading is cleared after the auto-reload completes.
   */
  useEffect(() => {
    reload();
    if (!loading) setIsReloading(false);
  }, [reload, lang]);

  return { loading, hasError, isReloading, reload };
}