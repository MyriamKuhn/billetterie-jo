import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  // … tes autres champs
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) => {
    const items = [...get().items];
    const idx = items.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      // incrémente la quantité
      items[idx] = { ...items[idx], quantity: items[idx].quantity + item.quantity };
    } else {
      items.push(item);
    }
    set({ items });
  },

  removeItem: (id) => {
    set({ items: get().items.filter(i => i.id !== id) });
  },

  clearCart: () => {
    set({ items: [] });
  },
}));
