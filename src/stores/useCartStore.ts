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
  cartId: string | null;
  /** Fetch the current cart from the API and update state */
  loadCart: () => Promise<void>;
  /** Add or update a cart item via API, then reload cart */
  addItem: (id: string, quantity: number, availableQuantity: number) => Promise<void>;
  /** Remove all items from the cart via API, then reload cart */
  clearCart: () => Promise<void>;
  /** Manually set the guest cart ID (persisted) */
  setGuestCartId: (id: string | null) => void;
  /** Manually set the authenticated cart ID (persisted) */
  setCartId: (id: string | null) => void;
  /** Whether the cart is locked (e.g. during payment) */
  isLocked: boolean;
  /** Lock the cart to disable further modifications */
  lockCart: () => void;
  /** Unlock the cart to re-enable modifications */
  unlockCart: () => void;
}

/**
 * Zustand store for managing the shopping cart.
 * - Fetches cart items from the API
 * - Allows adding/removing items
 * - Persists guest and authenticated cart IDs
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      // Create a dedicated Axios instance for cart operations
      const axiosInstance: AxiosInstance = axios.create({
        baseURL: API_BASE_URL,
        timeout: Number(import.meta.env.VITE_AXIOS_TIMEOUT) || 5000,
        headers: { 'Content-Type': 'application/json' },
      });

      // Request interceptor to attach auth or guest cart headers
      axiosInstance.interceptors.request.use((config) => {
        const token = useAuthStore.getState().authToken;
        const lang = useLanguageStore.getState().lang;
        config.headers!['Accept-Language'] = lang;

        if (token) {
          config.headers!['Authorization'] = `Bearer ${token}`;
        } else {
          // For anonymous users, include the guest cart ID header if set
          const guestCartId = get().guestCartId;
          if (guestCartId) {
            config.headers!['X-Guest-Cart-ID'] = guestCartId;
          }
        }
        return config;
      });

      // Update persisted guestCartId from API metadata
      const syncGuestCartId = (meta: any) => {
        const apiId = meta?.guest_cart_id;
        if (apiId && apiId !== get().guestCartId) {
          set({ guestCartId: apiId });
        }
      };

      // Update persisted cartId from API payload
      const syncCartId = (resData: any) => {
        if (resData?.id != null) {
          const apiCartId = String(resData.id);
          if (apiCartId !== get().cartId) {
            set({ cartId: apiCartId });
          }
        }
      };

      // Determine if current user is admin/employee (they should not have a cart)
      const isPrivilegedUser = () => {
        const role = useAuthStore.getState().role;
        return role === 'admin' || role === 'employee';
      };

      return {
        items: [],
        guestCartId: null,
        cartId: null,

        isLocked: false,
        lockCart: () => {
          set({ isLocked: true });
        },
        unlockCart: () => {
          set({ isLocked: false });
        },

        setGuestCartId: (id: string | null) => set({ guestCartId: id }),
        setCartId: (id: string | null) => set({ cartId: id }),

        loadCart: async () => {
          if (isPrivilegedUser()) {
            logWarn('loadCart', 'Attempt to load cart by privileged user');
            return;
          }
          try {
            const res = await axiosInstance.get('/api/cart');

            const payload = res.data;
            if (payload) {
              if (payload.meta) {
                syncGuestCartId(res.data?.meta);
              }
              if (payload.data) {
                syncCartId(payload.data);
              }
            }
            // Convert API raw items to our CartItem shape
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
          if (isPrivilegedUser()) {
            throw new Error('CartLockedForPrivilegedUser');
          }
          if (get().isLocked) {
            throw new Error('CartLocked');
          }
          if (quantity > availableQuantity) {
            throw new Error('Quantity exceeds available stock');
          }
          try {
            await axiosInstance.patch(`/api/cart/items/${id}`, { quantity });
          } catch (err) {
            logError('addItem', err);
            throw err;
          }
          try {
            // Reload cart in background (errors are logged but not thrown)
            await get().loadCart();
          } catch (warn) {
            logWarn('addItem → loadCart', warn);
          }
        },

        clearCart: async () => {
          if (isPrivilegedUser()) {
            throw new Error('CartLockedForPrivilegedUser');
          }
          if (get().isLocked) {
            throw new Error('CartLocked');
          }
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
          try {
            // Reload cart in background
            await get().loadCart();
          } catch (warn) {
            logWarn('clearCart → loadCart', warn);
          }
        },
      };
    },
    {
      name: 'cart-storage',
      // Persist only guestCartId and cartId in localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ guestCartId: state.guestCartId, cartId: state.cartId }),
    }
  )
);
