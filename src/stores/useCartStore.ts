import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios, { type AxiosInstance } from 'axios';
import { useLanguageStore } from './useLanguageStore';
import { useAuthStore } from './useAuthStore';
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
  image: string;
  date: string;
  time?: string;
  location: string;
  quantity: number;
  price: number;
  totalPrice?: number;
  inStock: boolean;
  availableQuantity: number;
  discountRate: number | null;
  originalPrice: number | null;
}

interface CartState {
  items: CartItem[];
  guestCartId: string | null;
  loadCart: () => Promise<void>;
  addItem: (id: string, quantity: number, availableQuantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  setGuestCartId: (id: string | null) => void; // pour vider du store
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      // Crée une instance Axios
      const axiosInstance: AxiosInstance = axios.create({
        baseURL: API_BASE_URL,
        timeout: Number(import.meta.env.VITE_AXIOS_TIMEOUT) || 5000,
        headers: { 'Content-Type': 'application/json' },
      });

      // Intercepteur de requêtes
      axiosInstance.interceptors.request.use((config) => {
        // Récupère le token depuis le store Zustand
        const token = useAuthStore.getState().authToken;
        const lang = useLanguageStore.getState().lang;
        config.headers!['Accept-Language'] = lang;

        if (token) {
          config.headers!['Authorization'] = `Bearer ${token}`;
        } else {
          // Si pas de token, on envoie l’UUID du panier invité (s’il existe)
          const guestCartId = get().guestCartId;
          if (guestCartId) {
            config.headers!['X-Guest-Cart-ID'] = guestCartId;
          }
        }
        return config;
      });

      // Synchronise le guestCartId reçu par l’API dans le store
      const syncGuestCartId = (meta: any) => {
        const apiId = meta?.guest_cart_id;
        if (apiId && apiId !== get().guestCartId) {
          set({ guestCartId: apiId });
        }
      };

      return {
        items: [],
        guestCartId: null,

        setGuestCartId: (id: string | null) => set({ guestCartId: id }),

        loadCart: async () => {
          try {
            const res = await axiosInstance.get('/api/cart');
            // Met à jour le guestCartId si l'API en retourne un (ou remet à jour le TTL)
            syncGuestCartId(res.data?.meta);

            // Mappe les RawCartItem vers CartItem
            const raw: RawCartItem[] = res.data?.data?.cart_items ?? [];
            const items: CartItem[] = raw
              .filter((ci) => ci.in_stock)
              .map((ci: RawCartItem) => ({
                id: ci.product_id.toString(),
                name: ci.product.name,
                image: ci.product.image,
                date: ci.product.date,
                time: ci.product.time ?? undefined,
                location: ci.product.location,
                quantity: Number(ci.quantity),
                price: ci.unit_price,
                totalPrice: ci.total_price,
                inStock: ci.in_stock,
                availableQuantity: ci.available_quantity,
                discountRate: ci.discount_rate,
                originalPrice: ci.original_price,
              }));
            set({ items });
          } catch (err) {
            logError('loadCart', err);
            throw err;
          }
        },

        addItem: async (id, quantity, availableQuantity) => {
          if (quantity > availableQuantity) {
            throw new Error('Quantity exceeds available stock');
          }
          try {
            await axiosInstance.patch(`/api/cart/items/${id}`, { quantity });
          } catch (err) {
            logError('addItem', err);
            throw err;
          }
          // Tente de recharger le panier sans bloquer sur l’erreur
          try {
            await get().loadCart();
          } catch (warn) {
            logWarn('addItem → loadCart', warn);
          }
        },

        clearCart: async () => {
          const token = useAuthStore.getState().authToken;
          if (!token) {
            logWarn('clearCart', 'no auth token');
            return;
          }
          try {
            await axiosInstance.delete('/api/cart/items');
          } catch (err) {
            logError('clearCart', err);
            throw err;
          }
          set({ items: [] });
          // Tente de recharger le panier sans bloquer sur l’erreur
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
      partialize: (state) => ({ guestCartId: state.guestCartId }),
    }
  )
);
