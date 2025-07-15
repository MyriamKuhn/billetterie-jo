import { useCartStore } from '../stores/useCartStore';
import { useCustomSnackbar } from './useCustomSnackbar';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook to add items to the cart with error handling and user notifications.
 * 
 * Returns an async function that attempts to update the cart quantity for a given item.
 * - If the cart is locked, it informs the user and aborts.
 * - On success, it notifies the user.
 * - On failure, it distinguishes between out‑of‑stock errors and generic errors.
 */
export function useAddToCart() {
  // Retrieve the addItem action from the cart store
  const addItem = useCartStore.getState().addItem;
  // Get the notify function for showing snackbars
  const { notify } = useCustomSnackbar();
  // Translation function scoped to the 'cart' namespace
  const { t } = useTranslation('cart');

  return async (id: string, desiredQty: number, availableQty: number): Promise<boolean> => {
    try {
      // Check if the cart is currently locked (e.g., during checkout)
      const isLocked = useCartStore.getState().isLocked;
      if (isLocked) {
        // Inform the user that they cannot modify quantities right now
        notify(t('errors.cart_locked'), 'warning');
        return false;
      }
      
      // Attempt to add (or update) the item quantity in the store
      await addItem(id, desiredQty, availableQty);

      // Notify the user of success
      notify(t('cart.add_success'), 'success');
      return true;
    } catch (err: any) {
      // If the error message suggests the desired quantity exceeds stock, warn the user
      if (err.message.includes('exceeds')) {
        notify(t('cart.not_enough_stock', { count: availableQty }), 'warning');
      } else {
        // Otherwise, show a generic update error
        notify(t('errors.error_update'), 'error');
      }
      return false;
    }
  };
}
