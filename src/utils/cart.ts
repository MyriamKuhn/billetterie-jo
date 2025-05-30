import { useCartStore, type CartItem } from '../stores/cartStore';

export function enqueueAddToCart(item: CartItem) {
  setTimeout(() => {
    useCartStore.getState().addItem(item);
  }, 0);
}