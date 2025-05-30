import { useEffect, useRef } from 'react';
import { useCustomSnackbar } from '../hooks/useCustomSnackbar';
import { useTranslation } from 'react-i18next';
import type { CartItem } from '../stores/cartStore';

export function useStockChangeNotifier(items: CartItem[], isReloading: boolean) {
  const prevRef = useRef<CartItem[]>([]);
  const { notify } = useCustomSnackbar();
  const { t } = useTranslation('cart');

  useEffect(() => {
    if (!isReloading) {
      prevRef.current = items;
      return;
    }

    const prev = prevRef.current;
    prev.forEach(oldItem => {
      const cur = items.find(i => i.id === oldItem.id);

      if (!cur) {
        notify(
          t('cart.removed_unavailable', { name: oldItem.name }),
          'warning'
        );
      } else if (cur.quantity < oldItem.quantity) {
        notify(
          t('cart.quantity_reduced', {
            name: cur.name,
            count: cur.quantity
          }),
          'warning'
        );
      }
    });
    prevRef.current = items;
  }, [items, isReloading, notify, t]);
}
