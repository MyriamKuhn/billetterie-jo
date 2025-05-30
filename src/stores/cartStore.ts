import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios, { type AxiosInstance } from 'axios';
import { useLanguageStore } from './useLanguageStore';
import { API_BASE_URL } from '../config';
import { logError, logWarn } from '../utils/logger';

interface RawCartItem {
  id:    number | null;
  product_id: number;
  quantity: string | number;
  unit_price: number;
  total_price: number;
  original_price: number | null;
  discount_rate: number | null;
  in_stock: boolean;
  available_quantity: number;
  product: {
    name:  string;
    image: string;
    date:  string;
    time?: string;
    location: string;
  };
}

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  inStock: boolean;
  availableQuantity: number;
}

interface CartState {
  items: CartItem[];
  guestCartId: string | null;
  loadCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      // axios instance
      const axiosInstance: AxiosInstance = axios.create({
        baseURL: API_BASE_URL,
        timeout: Number(import.meta.env.VITE_AXIOS_TIMEOUT) || 5000,
        headers: { 'Content-Type': 'application/json' },
      });

      // intercepteur
      axiosInstance.interceptors.request.use(config => {
        const token = localStorage.getItem('authToken');
        const lang = useLanguageStore.getState().lang;
        config.headers!['Accept-Language'] = lang;

        if (token) {
          config.headers!['Authorization'] = `Bearer ${token}`;
        } else {
          const guestCartId = get().guestCartId;
          if (guestCartId) {
            config.headers!['X-Guest-Cart-ID'] = guestCartId;
          }
        }
        return config;
      });

      // sync du guestCartId
      const syncGuestCartId = (meta: any) => {
        const apiId = meta?.guest_cart_id;
        if (apiId && apiId !== get().guestCartId) {
          set({ guestCartId: apiId });
        }
      };

      return {
        // initial state
        items: [],
        guestCartId: null,

        loadCart: async () => {
          try {
            const res = await axiosInstance.get('/api/cart');
            // 3.1 Met à jour le guestCartId (ou le réinitialise TTL)
            syncGuestCartId(res.data?.meta);

            // 3.2 Mappe les items
            const raw: RawCartItem[] = res.data?.data?.cart_items ?? [];
            const items: CartItem[] = raw
              .filter(ci => ci.in_stock)
              .map((ci: RawCartItem) => ({
                id: ci.product_id.toString(),
                name: ci.product.name,
                quantity: Number(ci.quantity),
                price: ci.unit_price,
                inStock: ci.in_stock,
                availableQuantity: ci.available_quantity,
              }));
            set({ items });
          } catch (err) {
            logError('loadCart', err);
            throw err;
          }
        },

        addItem: async item => {
          if (item.quantity > item.availableQuantity) {
            throw new Error('Quantity exceeds available stock');
          }
          try {
            await axiosInstance.patch(
              `/api/cart/items/${item.id}`,
              { quantity: item.quantity }
            );
          } catch (err) {
            logError('addItem', err);
            throw err;
          }
          // Tentative de rafraîchissement du panier, mais on ne propage pas l'erreur de refresh
          try {
            await get().loadCart();
          } catch (warn) {
            logWarn('addItem → loadCart', warn);
          }
        },

        clearCart: async () => {
          const token = localStorage.getItem('authToken');
          if (!token) {
            logWarn('clearCart', 'no auth token');
            return;
          }
          // Suppression du panier côté serveur
          try {
            await axiosInstance.delete('/api/cart/items');
          } catch (err) {
            logError('clearCart', err);
            throw err;
          }
          // Effacement local et tentative de rafraîchissement sans throw
          set({ items: [] });
          try {
            await get().loadCart();
          } catch (warn) {
            logWarn('clearCart → loadCart', warn);
          }
        },
      };
    },
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ guestCartId: state.guestCartId }),
    }
  )
);