import { useEffect, useRef } from 'react';
import { useCustomSnackbar } from '../hooks/useCustomSnackbar';
import { useTranslation } from 'react-i18next';
import type { CartItem } from '../stores/useCartStore';

/**
 * Hook to notify the user when stock availability changes after reloading the cart.
 *
 * @param items - Current cart items
 * @param isReloading - Flag indicating whether a reload just occurred
 */
export function useStockChangeNotifier(items: CartItem[], isReloading: boolean) {
  const prevRef = useRef<CartItem[]>([]);
  const { notify } = useCustomSnackbar();
  const { t } = useTranslation('cart');

  useEffect(() => {
    // If not reloading, update the previous items snapshot and exit
    if (!isReloading) {
      prevRef.current = items;
      return;
    }

    const prev = prevRef.current;
    prev.forEach(oldItem => {
      const cur = items.find(i => i.id === oldItem.id);

      // If the item has been removed due to lack of stock
      if (!cur) {
        notify(
          t('cart.removed_unavailable', { name: oldItem.name }),
          'warning'
        );

      // If the available quantity is less than before
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

    // Update snapshot for next comparison
    prevRef.current = items;
  }, [items, isReloading, notify, t]);
}
