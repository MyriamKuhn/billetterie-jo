import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { act } from '@testing-library/react';
import { API_BASE_URL } from '../config';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// 1) Mock useLanguageStore pour retourner une langue fixe
vi.mock('./useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: {
    getState: vi.fn(() => ({ lang: 'en' })),
  },
}));

// 2) Spy sur les fonctions de logger
vi.mock('../utils/logger', () => ({
  __esModule: true,
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

// 3) Mock axios et expose l’instance mockée en tant que __mockAxios
vi.mock('axios', () => {
  const axiosMockInstance = {
    interceptors: {
      request: { use: vi.fn() },
    },
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  const createMock = vi.fn(() => axiosMockInstance);
  return {
    __esModule: true,
    default: { create: createMock },
    __mockAxios: axiosMockInstance,
  };
});

import * as axios from 'axios';
const __mockAxios = (axios as any).__mockAxios as {
  interceptors: { request: { use: ReturnType<typeof vi.fn> } };
  get: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};
import { logError, logWarn } from '../utils/logger';
import { useLanguageStore } from './useLanguageStore';

// ─── Tests de useCartStore (hors interceptors) ─────────────────────────────────

import { useCartStore, type CartItem } from './useCartStore';

describe('useCartStore', () => {
  beforeEach(() => {
    // Réinitialiser l’état du store
    useCartStore.setState({
      items: [],
      guestCartId: null,
    });
    // Réinitialiser les mocks
    (logError as ReturnType<typeof vi.fn>).mockReset();
    (logWarn as ReturnType<typeof vi.fn>).mockReset();
    __mockAxios.get.mockReset();
    __mockAxios.patch.mockReset();
    __mockAxios.delete.mockReset();
    (useLanguageStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ lang: 'en' });
    // Vider le localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('axios.create est appelé avec timeout = 5000 par défaut', () => {
    const createSpy = (axios as any).default.create as ReturnType<typeof vi.fn>;
    expect(createSpy).toHaveBeenCalled();
    const configArg = createSpy.mock.calls[0][0];
    expect(configArg.timeout).toBe(5000);
    expect(configArg.baseURL).toBe(API_BASE_URL);
  });

  it('loadCart: syncGuestCartId met à jour guestCartId quand meta différent', async () => {
    const rawItems: any[] = [];
    const fakeMeta = { guest_cart_id: 'NEW_ID' };
    __mockAxios.get.mockResolvedValue({
      data: { data: { cart_items: rawItems }, meta: fakeMeta },
    });

    await act(async () => {
      await useCartStore.getState().loadCart();
    });

    expect(useCartStore.getState().guestCartId).toBe('NEW_ID');
  });

  it('loadCart: syncGuestCartId ne change pas guestCartId si identique', async () => {
    useCartStore.setState({ items: [], guestCartId: 'SAME_ID' });
    const rawItems: any[] = [];
    const fakeMeta = { guest_cart_id: 'SAME_ID' };
    __mockAxios.get.mockResolvedValue({
      data: { data: { cart_items: rawItems }, meta: fakeMeta },
    });

    await act(async () => {
      await useCartStore.getState().loadCart();
    });

    expect(useCartStore.getState().guestCartId).toBe('SAME_ID');
  });

  it('loadCart: successful response updates items et guestCartId', async () => {
    const rawItems = [
      {
        id: 1,
        product_id: 42,
        quantity: '2',
        unit_price: 10,
        total_price: 20,
        original_price: 12,
        discount_rate: 0.1,
        in_stock: true,
        available_quantity: 5,
        product: {
          name: 'Product A',
          image: 'imgA.jpg',
          date: '2023-01-01',
          location: 'Loc A',
        },
      },
      {
        id: 2,
        product_id: 43,
        quantity: '1',
        unit_price: 5,
        total_price: 5,
        original_price: null,
        discount_rate: null,
        in_stock: false,
        available_quantity: 0,
        product: {
          name: 'Product B',
          image: 'imgB.jpg',
          date: '2023-02-01',
          location: 'Loc B',
        },
      },
    ];
    const fakeMeta = { guest_cart_id: 'GUEST123' };
    __mockAxios.get.mockResolvedValue({
      data: { data: { cart_items: rawItems }, meta: fakeMeta },
    });

    await act(async () => {
      await useCartStore.getState().loadCart();
    });

    const state = useCartStore.getState();
    expect(state.guestCartId).toBe('GUEST123');
    expect(state.items).toEqual<CartItem[]>([
      {
        id: '42',
        name: 'Product A',
        image: 'imgA.jpg',
        date: '2023-01-01',
        time: undefined,
        location: 'Loc A',
        quantity: 2,
        price: 10,
        totalPrice: 20,
        inStock: true,
        availableQuantity: 5,
        discountRate: 0.1,
        originalPrice: 12,
      },
    ]);
    expect(logError).not.toHaveBeenCalled();
  });

  it('loadCart: failing response logs error et throw', async () => {
    const err = new Error('Network Fail');
    __mockAxios.get.mockRejectedValue(err);

    await expect(useCartStore.getState().loadCart()).rejects.toThrow(err);
    expect(logError).toHaveBeenCalledWith('loadCart', err);
  });

  it('addItem: quantity > availableQuantity throw immédiatement', async () => {
    const { addItem } = useCartStore.getState();

    await expect(addItem('1', 10, 5)).rejects.toThrow('Quantity exceeds available stock');
    expect(__mockAxios.patch).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });

  it('addItem: successful patch et loadCart subséquent', async () => {
    const spyLoadCart = vi.spyOn(useCartStore.getState(), 'loadCart').mockResolvedValue();
    __mockAxios.patch.mockResolvedValue({});

    await act(async () => {
      await useCartStore.getState().addItem('7', 3, 5);
    });

    expect(__mockAxios.patch).toHaveBeenCalledWith('/api/cart/items/7', { quantity: 3 });
    expect(spyLoadCart).toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
    expect(logWarn).not.toHaveBeenCalled();
  });

  it('addItem: patch OK mais loadCart interne rejette → logWarn', async () => {
    __mockAxios.patch.mockResolvedValue({});
    const loadErr = new Error('Load Fail');
    const spyLoadCart = vi.spyOn(useCartStore.getState(), 'loadCart').mockRejectedValue(loadErr);

    await act(async () => {
      await useCartStore.getState().addItem('7', 2, 5);
    });

    expect(__mockAxios.patch).toHaveBeenCalled();
    expect(spyLoadCart).toHaveBeenCalled();
    expect(logWarn).toHaveBeenCalledWith('addItem → loadCart', loadErr);
  });

  it('clearCart: no auth token logs warning et retourne', async () => {
    localStorage.removeItem('authToken');
    const { clearCart } = useCartStore.getState();

    await act(async () => {
      await clearCart();
    });

    expect(logWarn).toHaveBeenCalledWith('clearCart', 'no auth token');
    expect(__mockAxios.delete).not.toHaveBeenCalled();
  });

  it('clearCart: token présent, delete OK, items clear, et loadCart appelé', async () => {
    localStorage.setItem('authToken', 'TOKEN123');
    useCartStore.setState({
      items: [
        {
          id: '1',
          name: 'X',
          image: '',
          date: '',
          location: '',
          quantity: 1,
          price: 10,
          inStock: true,
          availableQuantity: 1,
          discountRate: null,
          originalPrice: null,
        },
      ],
      guestCartId: null,
    });
    __mockAxios.delete.mockResolvedValue({});
    const spyLoadCart = vi.spyOn(useCartStore.getState(), 'loadCart').mockResolvedValue();

    await act(async () => {
      await useCartStore.getState().clearCart();
    });

    expect(__mockAxios.delete).toHaveBeenCalledWith('/api/cart/items');
    expect(useCartStore.getState().items).toEqual([]);
    expect(spyLoadCart).toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
    expect(logWarn).not.toHaveBeenCalled();
  });

  it('clearCart: token prsnt, delete OK, mais loadCart interne rejette → logWarn', async () => {
    localStorage.setItem('authToken', 'TOKEN123');
    __mockAxios.delete.mockResolvedValue({});
    const loadErr = new Error('Load Fail');
    const spyLoadCart = vi.spyOn(useCartStore.getState(), 'loadCart').mockRejectedValue(loadErr);
    useCartStore.setState({
      items: [
        {
          id: '1',
          name: 'X',
          image: '',
          date: '',
          location: '',
          quantity: 1,
          price: 10,
          inStock: true,
          availableQuantity: 1,
          discountRate: null,
          originalPrice: null,
        },
      ],
      guestCartId: null,
    });

    await act(async () => {
      await useCartStore.getState().clearCart();
    });

    expect(__mockAxios.delete).toHaveBeenCalled();
    expect(useCartStore.getState().items).toEqual([]);
    expect(spyLoadCart).toHaveBeenCalled();
    expect(logWarn).toHaveBeenCalledWith('clearCart → loadCart', loadErr);
  });

  it('clearCart: token prsnt, delete rejette → logError et throw', async () => {
    localStorage.setItem('authToken', 'TOKEN123');
    const deleteErr = new Error('Delete Fail');
    __mockAxios.delete.mockRejectedValue(deleteErr);
    useCartStore.setState({
      items: [
        {
          id: '1',
          name: 'X',
          image: '',
          date: '',
          location: '',
          quantity: 1,
          price: 10,
          inStock: true,
          availableQuantity: 1,
          discountRate: null,
          originalPrice: null,
        },
      ],
      guestCartId: null,
    });

    await expect(useCartStore.getState().clearCart()).rejects.toThrow(deleteErr);
    expect(logError).toHaveBeenCalledWith('clearCart', deleteErr);
  });
});

// ─── Tests des interceptors et addItem (erreur) avec ré-import du store ───────────────────

describe('useCartStore – interceptors et addItem (erreur)', () => {
  let registeredInterceptor: (config: any) => any;
  let useCartStoreRef: typeof import('./useCartStore').useCartStore;

  beforeAll(async () => {
    vi.resetModules();
    // Réimporter le store pour que l’intercepteur soit enregistré sur le mock fraîchement réinitialisé
    const imported = await import('./useCartStore');
    useCartStoreRef = imported.useCartStore;
    const axiosImported = await import('axios');
    registeredInterceptor = (axiosImported as any).__mockAxios.interceptors.request.use
      .mock.calls[0][0] as (config: any) => any;
  });

  beforeEach(() => {
    useCartStoreRef.setState({ items: [], guestCartId: null });
    __mockAxios.get.mockReset();
    __mockAxios.patch.mockReset();
    __mockAxios.delete.mockReset();
    (logError as ReturnType<typeof vi.fn>).mockReset();
    (useLanguageStore.getState as ReturnType<typeof vi.fn>).mockReset();
    localStorage.clear();
  });

  it('interceptor: ajoute Accept-Language + Authorization quand token présent', () => {
    localStorage.setItem('authToken', 'TOKEN_ABC');
    (useLanguageStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ lang: 'fr' });

    const fakeConfig: any = { headers: {} };
    const resultConfig = registeredInterceptor(fakeConfig);

    expect(resultConfig.headers['Accept-Language']).toBe('fr');
    expect(resultConfig.headers['Authorization']).toBe('Bearer TOKEN_ABC');
    expect(resultConfig.headers['X-Guest-Cart-ID']).toBeUndefined();
  });

  it('interceptor: ajoute X-Guest-Cart-ID quand pas de token mais guestCartId présent', () => {
    localStorage.removeItem('authToken');
    (useLanguageStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ lang: 'en' });
    useCartStoreRef.setState({ guestCartId: 'GUEST_123', items: [] });

    const fakeConfig: any = { headers: {} };
    const resultConfig = registeredInterceptor(fakeConfig);

    expect(resultConfig.headers['Accept-Language']).toBe('en');
    expect(resultConfig.headers['Authorization']).toBeUndefined();
    expect(resultConfig.headers['X-Guest-Cart-ID']).toBe('GUEST_123');
  });

  it('addItem: si axios.patch rejette, logError est appelé et l’erreur est propagée', async () => {
    const fakeError = new Error('Patch KO');
    __mockAxios.patch.mockRejectedValue(fakeError);

    await expect(useCartStoreRef.getState().addItem('10', 1, 5)).rejects.toThrow(fakeError);
    expect(logError).toHaveBeenCalledWith('addItem', fakeError);
  });
});

// ─── Tests additionnels pour timeout, interceptor, rawItems ──────────────────────────────

describe('Couverture spécifique : timeout, interceptor, rawItems', () => {
  let resetModulesAndImport: () => Promise<{
    useCartStore: typeof import('./useCartStore').useCartStore;
    __mockAxios: typeof __mockAxios;
    axiosImported: typeof import('axios');
  }>;

  beforeAll(() => {
    // Fonction utilitaire pour resetModules et réimporter store + axios mock
    resetModulesAndImport = async () => {
      vi.resetModules();
      const axiosImported = await import('axios');
      const __mock = (axiosImported as any).__mockAxios as typeof __mockAxios;
      const imported = await import('./useCartStore');
      return { useCartStore: imported.useCartStore, __mockAxios: __mock, axiosImported };
    };
  });

  it('axios.create utilise VITE_AXIOS_TIMEOUT quand défini', async () => {
    // Arrange : définir import.meta.env.VITE_AXIOS_TIMEOUT
    // @ts-ignore
    import.meta.env.VITE_AXIOS_TIMEOUT = '1234';

    // Act : réimporter le store pour recréer axios.create
    const { axiosImported } = await resetModulesAndImport();
    const createSpy = (axiosImported.default.create as ReturnType<typeof vi.fn>);

    // Assert : prendre le dernier appel à axios.create
    expect(createSpy).toHaveBeenCalled();
    const lastCallConfig = createSpy.mock.calls.slice(-1)[0][0];
    expect(lastCallConfig.timeout).toBe(1234);

    // Nettoyer pour les autres tests
    // @ts-ignore
    delete import.meta.env.VITE_AXIOS_TIMEOUT;
  });

  it('interceptor n’ajoute pas X-Guest-Cart-ID quand guestCartId est null (pas de token)', async () => {
    // Arrange : réimporter store pour avoir nouvel intercepteur
    const { useCartStore: localStore, __mockAxios: localMock } = await resetModulesAndImport();

    // Pas de token dans localStorage, guestCartId par défaut = null
    localStorage.removeItem('authToken');
    (useLanguageStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ lang: 'de' });
    localStore.setState({ guestCartId: null, items: [] });

    // Récupérer exactement l’intercepteur nouvellement enregistré
    const interceptorFn = localMock.interceptors.request.use.mock.calls.slice(-1)[0][0] as (
      config: any
    ) => any;
    const fakeConfig: any = { headers: {} };

    // Act
    const result = interceptorFn(fakeConfig);

    // Assert : pas de X-Guest-Cart-ID, mais Accept-Language = 'de'
    expect(result.headers['Accept-Language']).toBe('de');
    expect(result.headers['X-Guest-Cart-ID']).toBeUndefined();
    expect(result.headers['Authorization']).toBeUndefined();
  });

  it('interceptor ajoute X-Guest-Cart-ID quand guestCartId défini et pas de token', async () => {
    // Arrange : nouveau resetModules pour intercepteur frais
    const { useCartStore: localStore, __mockAxios: localMock } = await resetModulesAndImport();
    localStorage.removeItem('authToken');
    (useLanguageStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ lang: 'it' });
    localStore.setState({ guestCartId: 'GUEST_TEST', items: [] });

    const interceptorFn = localMock.interceptors.request.use.mock.calls.slice(-1)[0][0] as (
      config: any
    ) => any;
    const fakeConfig: any = { headers: {} };

    // Act
    const result = interceptorFn(fakeConfig);

    // Assert : X-Guest-Cart-ID = 'GUEST_TEST'
    expect(result.headers['X-Guest-Cart-ID']).toBe('GUEST_TEST');
    expect(result.headers['Accept-Language']).toBe('it');
    expect(result.headers['Authorization']).toBeUndefined();
  });

  it('loadCart gère res.data.data.cart_items undefined (rawItems = [])', async () => {
    // Arrange : importer un nouveau store pour éviter les spies existants
    const { useCartStore: localStore, __mockAxios: localMock } = await resetModulesAndImport();

    // Simuler undefined pour data.data.cart_items
    localMock.get.mockResolvedValue({
      data: {
        data: { cart_items: undefined },
        meta: { guest_cart_id: 'ANY' },
      },
    });

    // Act
    await act(async () => {
      await localStore.getState().loadCart();
    });

    // Assert : items = [], guestCartId mis à jour
    const state = localStore.getState();
    expect(state.items).toEqual([]);
    expect(state.guestCartId).toBe('ANY');
  });
});
