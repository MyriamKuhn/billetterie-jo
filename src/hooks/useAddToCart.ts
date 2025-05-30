import { useCartStore, type CartItem } from '../stores/cartStore';
import { useCustomSnackbar } from './useCustomSnackbar';
import { useTranslation } from 'react-i18next';

export function useAddToCart() {
  const addItem = useCartStore.getState().addItem;
  const { notify } = useCustomSnackbar();
  const { t } = useTranslation('cart');

  return async (id: string, name: string, desiredQty: number, unitPrice: number, availableQty: number) => {
    // construit l’objet CartItem
    const item: CartItem = {
      id: id,
      name: name,
      quantity: desiredQty,
      price: unitPrice,
      inStock: availableQty > 0,
      availableQuantity: availableQty
    };

    try {
      await addItem(item);
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
