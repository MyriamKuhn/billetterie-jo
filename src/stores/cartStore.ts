import { create } from 'zustand';
import axios, { type AxiosInstance } from 'axios';
import { useLanguageStore } from './useLanguageStore';
import { API_BASE_URL } from '../config';

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

export const useCartStore = create<CartState>((set, get) => {
  let guestCartId: string | null = localStorage.getItem('guestCartId');

  // 1) Création de l’instance axios
  const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
  });

  // 2) Intercepteur pour injecter guestCartId ou token
  axiosInstance.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    const lang = useLanguageStore.getState().lang;
    config.headers!['Accept-Language'] = lang;

    if (token) {
      config.headers!['Authorization'] = `Bearer ${token}`;
    } else if (guestCartId) {
      config.headers!['X-Guest-Cart-ID'] = guestCartId;
    }
    return config;
  });

  // 3) À chaque réponse de GET /api/cart, on synchronise guestCartId
  const syncGuestCartId = (meta: any) => {
    const apiId = meta?.guest_cart_id;
    if (apiId && apiId !== guestCartId) {
      guestCartId = apiId;
      localStorage.setItem('guestCartId', apiId);
      set({ guestCartId: apiId });
    }
  };

  return {
    items: [],
    guestCartId,

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
        console.error('Erreur loadCart', err);
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
        console.error('Erreur addItem', err);
        throw err;
      }
      // Tentative de rafraîchissement du panier, mais on ne propage pas l'erreur de refresh
      try {
        await get().loadCart();
      } catch (err) {
        console.warn('Erreur lors du rafraîchissement du panier après ajout', err);
        // Pas de throw pour éviter l'interruption d'exécution
      }
    },

    clearCart: async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('clearCart ignoré : pas d’utilisateur connecté');
        return;
      }
      // Suppression du panier côté serveur
      try {
        await axiosInstance.delete('/api/cart/items');
      } catch (err) {
        console.error('Erreur clearCart', err);
        throw err;
      }
      // Effacement local et tentative de rafraîchissement sans throw
      set({ items: [] });
      try {
        await get().loadCart();
      } catch (err) {
        console.warn('Erreur lors du rafraîchissement du panier après ajout', err);
        // Pas de throw pour éviter l'interruption d'exécution
      }
    },
  };
});