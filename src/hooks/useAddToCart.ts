import { useCartStore } from '../stores/useCartStore';
import { useCustomSnackbar } from './useCustomSnackbar';
import { useTranslation } from 'react-i18next';

export function useAddToCart() {
  const addItem = useCartStore.getState().addItem;
  const { notify } = useCustomSnackbar();
  const { t } = useTranslation('cart');

  return async (id: string, desiredQty: number, availableQty: number): Promise<boolean> => {
    try {
      const isLocked = useCartStore.getState().isLocked;
      if (isLocked) {
        notify(t('errors.cart_locked'), 'warning');
        return false;
      }
      
      await addItem(id, desiredQty, availableQty);
      notify(t('cart.add_success'), 'success');
      return true;
    } catch (err: any) {
      if (err.message.includes('exceeds')) {
        notify(t('cart.not_enough_stock', { count: availableQty }), 'warning');
      } else {
        notify(t('errors.error_update'), 'error');
      }
      return false;
    }
  };
}
