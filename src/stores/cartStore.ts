import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
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
  product: {
    name:  string;
    image: string;
    date:  string;
    time?: string;
    location: string;
  };
  available_quantity: number;
  in_stock: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface CartState {
  items: CartItem[];
  guestCartId: string | null;
  loadCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => {
  // Initialisation guestCartId
  const initGuestCartId = () => {
    const stored = localStorage.getItem('guestCartId');
    if (stored) return stored;
    const newId = uuidv4();
    localStorage.setItem('guestCartId', newId);
    return newId;
  };
  const guestCartId = initGuestCartId();

  // 1) On crée l’instance axios avec baseURL déjà configuré
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
  });

  // 2) On intercepte chaque requête pour y injecter nos headers dynamiques
  axiosInstance.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    const lang  = useLanguageStore.getState().lang;
    
    // on écrase ou ajoute
    config.headers!['Accept-Language'] = lang;
    
    if (token) {
      config.headers!['Authorization']   = `Bearer ${token}`;
      // clearCart ne sera appelé que si token existe, donc ok
    } else {
      config.headers!['X-Guest-Cart-Id'] = guestCartId;
    }
    
    return config;
  });

  return {
    items: [],
    guestCartId,

    loadCart: async () => {
      try {
        const res = await axiosInstance.get('/api/cart');
        // extrait le tableau quel que soit le shape
        const rawItems: RawCartItem[] = res.data?.data?.cart_items ?? [];
        // mappe vers CartItem[]
        const items: CartItem[] = rawItems.map(ci => ({
          // on utilise product_id comme identifiant, pour les guest.id est null
          id:       ci.product_id.toString(),
          name:     ci.product.name,
          quantity: Number(ci.quantity),
          price:    ci.unit_price,
        }));
        set({ items });
      } catch (err) {
        console.error('Erreur loadCart', err);
      }
    },

    addItem: async item => {
      try {
        await axiosInstance.patch(
          `/api/cart/items/${item.id}`,
          { quantity: item.quantity }
        );
        await get().loadCart();
      } catch (err) {
        console.error('Erreur addItem', err);
      }
    },

    clearCart: async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('clearCart ignoré : pas d’utilisateur connecté');
        return;
      }
      try {
        await axiosInstance.delete('/api/cart/items');
        set({ items: [] });
      } catch (err) {
        console.error('Erreur clearCart', err);
      }
    },
  };
});