// src/stores/useCartStore.test.ts
import { describe, it, expect, beforeEach, beforeAll, vi, type Mock } from 'vitest';
import { act } from '@testing-library/react';
import { API_BASE_URL } from '../config';

// 1️⃣ Mock useLanguageStore
vi.mock('./useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: { getState: vi.fn(() => ({ lang: 'en' })) },
}));
import { useLanguageStore } from './useLanguageStore';

// 2️⃣ Mock useAuthStore
vi.mock('./useAuthStore', () => ({
  __esModule: true,
  useAuthStore: { getState: vi.fn(() => ({ authToken: 'TOKEN123' })) },
}));
import { useAuthStore } from './useAuthStore';

// 3️⃣ Mock logger
vi.mock('../utils/logger', () => ({
  __esModule: true,
  logError: vi.fn(),
  logWarn: vi.fn(),
}));
import { logError, logWarn } from '../utils/logger';

// 4️⃣ Mock axios and capture instance
vi.mock('axios', () => {
  const axiosMock = {
    interceptors: { request: { use: vi.fn() } },
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return {
    __esModule: true,
    default: { create: vi.fn(() => axiosMock) },
    __mockAxios: axiosMock,
  };
});
import * as axios from 'axios';
// extract the axiosMock instance
const createSpy = (axios as any).default.create as ReturnType<typeof vi.fn>;
if (!createSpy.mock.results.length) throw new Error('axios.create mock not called');
const __mockAxios = createSpy.mock.results[0].value;

// 5️⃣ Import store under test
import { useCartStore, type CartItem } from './useCartStore';

// Utility to re-import fresh store for interceptors
let resetModulesAndImport: () => Promise<{ store: typeof import('./useCartStore').useCartStore; axiosMock: typeof __mockAxios }>;
beforeAll(() => {
  resetModulesAndImport = async () => {
    vi.resetModules()
   // on ne touche plus à import.meta.env.VITE_AXIOS_TIMEOUT
    const axiosMod = await import('axios')
    const axiosMock = (axiosMod as any).__mockAxios as typeof __mockAxios
    const storeMod = await import('./useCartStore')
    return { store: storeMod.useCartStore, axiosMock }
  }
})

// ── Core methods tests ───────────────────────────────────────────────────────────
describe('useCartStore - core methods', () => {
  beforeEach(() => {
    // reset store state and axios mocks
    useCartStore.setState({ items: [], guestCartId: null });
    __mockAxios.get.mockClear();
    __mockAxios.patch.mockClear();
    __mockAxios.delete.mockClear();
    (useLanguageStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ lang: 'en' });
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ authToken: 'TOKEN123' });
    (logError as ReturnType<typeof vi.fn>).mockClear();
    (logWarn as ReturnType<typeof vi.fn>).mockClear();
  });

  it('creates axios instance with correct config', () => {
    const spy = (axios as any).default.create as ReturnType<typeof vi.fn>;
    expect(spy).toHaveBeenCalled();
    const cfg = spy.mock.calls[0][0];
    expect(cfg.baseURL).toBe(API_BASE_URL);
    expect(cfg.timeout).toBe(5000);
  });

  it('loadCart updates guestCartId on new meta', async () => {
    __mockAxios.get.mockResolvedValue({ data: { data: { cart_items: [] }, meta: { guest_cart_id: 'NEW' } } });
    await act(() => useCartStore.getState().loadCart());
    expect(useCartStore.getState().guestCartId).toBe('NEW');
  });

  it('loadCart keeps guestCartId when meta unchanged', async () => {
    useCartStore.setState({ items: [], guestCartId: 'OLD' });
    __mockAxios.get.mockResolvedValue({ data: { data: { cart_items: [] }, meta: { guest_cart_id: 'OLD' } } });
    await act(() => useCartStore.getState().loadCart());
    expect(useCartStore.getState().guestCartId).toBe('OLD');
  });

  it('loadCart filters and maps items', async () => {
    const raw: any[] = [
      { product_id: 1, quantity: '2', unit_price: 10, total_price: 20, original_price: 5, discount_rate: 0.1, in_stock: true, available_quantity: 5, product: { name: 'A', image: 'a.jpg', date: 'd', location: 'loc' } },
      { product_id: 2, quantity: '1', unit_price: 5, total_price: 5, original_price: null, discount_rate: null, in_stock: false, available_quantity: 0, product: { name: 'B', image: 'b.jpg', date: 'd', location: 'loc' } }
    ];
    __mockAxios.get.mockResolvedValue({ data: { data: { cart_items: raw }, meta: {} } });
    await act(() => useCartStore.getState().loadCart());
    expect(useCartStore.getState().items).toEqual<CartItem[]>([
      expect.objectContaining({ id: '1', name: 'A', quantity: 2, price: 10, totalPrice: 20 })
    ]);
  });

  it('loadCart logs error and throws', async () => {
    const err = new Error('fail');
    __mockAxios.get.mockRejectedValue(err);
    await expect(useCartStore.getState().loadCart()).rejects.toThrow(err);
    expect(logError).toHaveBeenCalledWith('loadCart', err);
  });

  it('addItem throws on exceeding quantity', async () => {
    await expect(useCartStore.getState().addItem('1', 10, 5)).rejects.toThrow('Quantity exceeds available stock');
  });

  it('addItem patches and reloads on success', async () => {
    const spy = vi.spyOn(useCartStore.getState(), 'loadCart').mockResolvedValue();
    __mockAxios.patch.mockResolvedValue({});
    await act(() => useCartStore.getState().addItem('1', 2, 5));
    expect(__mockAxios.patch).toHaveBeenCalledWith('/api/cart/items/1', { quantity: 2 });
    expect(spy).toHaveBeenCalled();
  });

  it('addItem warns if reload fails', async () => {
    __mockAxios.patch.mockResolvedValue({});
    const err = new Error('e');
    vi.spyOn(useCartStore.getState(), 'loadCart').mockRejectedValue(err);
    await act(() => useCartStore.getState().addItem('1', 1, 5));
    expect(logWarn).toHaveBeenCalledWith('addItem → loadCart', err);
  });

  it('clearCart warns and exits if no token', async () => {
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ authToken: null });
    await act(() => useCartStore.getState().clearCart());
    expect(logWarn).toHaveBeenCalledWith('clearCart', 'no auth token');
  });

  it('clearCart deletes, clears and reloads on success', async () => {
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ authToken: 'TOK' });
    const spy = vi.spyOn(useCartStore.getState(), 'loadCart').mockResolvedValue();
    __mockAxios.delete.mockResolvedValue({});
    useCartStore.setState({ items: [{ id: '1', name: 'X', image: '', date: '', location: '', quantity:1, price:1, inStock:true, availableQuantity:1, discountRate:null, originalPrice:null }], guestCartId: null });
    await act(() => useCartStore.getState().clearCart());
    expect(__mockAxios.delete).toHaveBeenCalledWith('/api/cart/items');
    expect(useCartStore.getState().items).toEqual([]);
    expect(spy).toHaveBeenCalled();
  });

  it('clearCart logs error and throws on delete failure', async () => {
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ authToken: 'TOK' });
    const err = new Error('del fail');
    __mockAxios.delete.mockRejectedValue(err);
    await expect(useCartStore.getState().clearCart()).rejects.toThrow(err);
    expect(logError).toHaveBeenCalledWith('clearCart', err);
  });

  it('loadCart when cart_items missing yields empty items', async () => {
    // 🔄 Reimporte un store tout neuf pour être sûr d’avoir la vraie méthode loadCart
    const { store, axiosMock } = await resetModulesAndImport()

    // 1) on simule la réponse sans cart_items
    axiosMock.get.mockResolvedValue({
      data: { data: {}, meta: {} },
    })

    // 2) on pré-remplit le store avec un item
    store.setState({
      items: [{
        id: 'x',
        name: 'X',
        image: '',
        date: '',
        location: '',
        quantity: 1,
        price: 1,
        inStock: true,
        availableQuantity: 1,
        discountRate: null,
        originalPrice: null,
      }],
      guestCartId: null,
    })

    // 3) on appelle loadCart et on attend la fin de la Promise
    await store.getState().loadCart()

    // 4) on vérifie bien que items a été écrasé par un tableau vide
    expect(store.getState().items).toEqual([])
  });
});

// ── Interceptors tests ─────────────────────────────────────────────────────────
describe('useCartStore interceptors', () => {
  let interceptor: (cfg: any) => any;

  beforeEach(async () => {
    const { store: freshStore, axiosMock } = await resetModulesAndImport();
    interceptor = (axiosMock.interceptors.request.use as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // reset store state
    freshStore.setState({ items: [], guestCartId: null });
    (useLanguageStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ lang: 'en' });
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ authToken: 'TOK' });
  });

  it('adds Accept-Language & Authorization when token present', () => {
    (useLanguageStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ lang: 'fr' });
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ authToken: 'ABC' });
    const cfg = interceptor({ headers: {} });
    expect(cfg.headers['Accept-Language']).toBe('fr');
    expect(cfg.headers['Authorization']).toBe('Bearer ABC');
    expect(cfg.headers['X-Guest-Cart-ID']).toBeUndefined();
  });

  it('adds X-Guest-Cart-ID when no token but guestCartId set', () => {
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ authToken: null });
    // set guestCartId in the fresh store state
    const freshStore = useCartStore;
    freshStore.setState({ items: [], guestCartId: 'GID' });
    const cfg = interceptor({ headers: {} });
    expect(cfg.headers['X-Guest-Cart-ID']).toBe('GID');
  });

  it('does not add X-Guest-Cart-ID when guestCartId null', () => {
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ authToken: null });
    const freshStore = useCartStore;
    freshStore.setState({ items: [], guestCartId: null });
    const cfg = interceptor({ headers: {} });
    expect(cfg.headers['X-Guest-Cart-ID']).toBeUndefined();
  });

  it('setGuestCartId met à jour guestCartId dans le store', () => {
    // État initial à null
    useCartStore.setState({ guestCartId: null })
    expect(useCartStore.getState().guestCartId).toBeNull()

    // On appelle la méthode
    useCartStore.getState().setGuestCartId('NEW_ID')
    expect(useCartStore.getState().guestCartId).toBe('NEW_ID')
  })

  it('addItem logError et rejette quand patch échoue', async () => {
    const err = new Error('patch failed')
    // Simule un échec du patch
    __mockAxios.patch.mockRejectedValueOnce(err)

    // quantity ≤ availableQuantity pour atteindre le catch de patch
    await expect(
      useCartStore.getState().addItem('1', 1, 5)
    ).rejects.toThrow(err)

    expect(logError).toHaveBeenCalledWith('addItem', err)
  })

  it('clearCart logWarn("clearCart → loadCart") quand reload échoue après delete', async () => {
    // On s'assure qu'il y a un token pour passer la guard
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      authToken: 'TOK',
    })

    // Delete OK
    __mockAxios.delete.mockResolvedValueOnce({})

    // Préremplit items pour vérifier qu'ils seront vidés
    useCartStore.setState({
      items: [{ id: '1', name: 'X', image: '', date: '', location:'', quantity:1, price:1, inStock:true, availableQuantity:1, discountRate:null, originalPrice:null }],
      guestCartId: null,
    })

    // Simule un échec du loadCart appelé en fin de clearCart
    const warnErr = new Error('reload failed')
    // Remplace la méthode loadCart dans le store
    useCartStore.setState({ loadCart: () => Promise.reject(warnErr) })

    // Appel de clearCart
    await act(() => useCartStore.getState().clearCart())

    // Les items doivent avoir été vidés malgré tout
    expect(useCartStore.getState().items).toEqual([])

    // Et on doit avoir loggué un warn
    expect(logWarn).toHaveBeenCalledWith('clearCart → loadCart', warnErr)
  })
});

// ── Module init tests for timeout ──────────────────────────────────────────────
describe('useCartStore module initialization', () => {
  beforeEach(() => {
    // On vide les anciens appels à axios.create
    createSpy.mockClear()
    // On retire tout stub précédent sur la variable d'env
    vi.stubEnv('VITE_AXIOS_TIMEOUT', undefined)
  })

  it('uses default timeout=5000 when VITE_AXIOS_TIMEOUT not set', async () => {
    // On s’assure qu’il n’y a pas de stub pour VITE_AXIOS_TIMEOUT
    // (c’est fait dans beforeEach)
    await resetModulesAndImport()
    const calls = createSpy.mock.calls
    const cfg = calls[calls.length - 1][0]
    expect(cfg.timeout).toBe(5000)
  })

  it('uses VITE_AXIOS_TIMEOUT from env when set', async () => {
    // On stub la variable d'environnement AVANT d'importer le module
    vi.stubEnv('VITE_AXIOS_TIMEOUT', '1234')
    await resetModulesAndImport()
    const calls = createSpy.mock.calls
    const cfg = calls[calls.length - 1][0]
    expect(cfg.timeout).toBe(1234)
  })
})

let resetAndImport: () => Promise<{
  store: typeof import('./useCartStore').useCartStore;
  axiosMock: typeof __mockAxios;
}>;
beforeAll(() => {
  resetAndImport = async () => {
    vi.resetModules();
    const axiosMod = await import('axios');
    const axiosMock = (axiosMod as any).__mockAxios as typeof __mockAxios;
    const storeMod = await import('./useCartStore');
    return { store: storeMod.useCartStore, axiosMock };
  };
});

describe('useCartStore – couverture des dernières branches', () => {
  let store: typeof useCartStore;
  let axiosMock: typeof __mockAxios;

  beforeEach(async () => {
    ({ store, axiosMock } = await resetAndImport());
    // reset axios
    axiosMock.get.mockClear();
    axiosMock.patch.mockClear();
    axiosMock.delete.mockClear();
    // reset state
    store.setState({
      items: [],
      guestCartId: null,
      cartId: null,
      isLocked: false,
    });
  });

  it('loadCart synchronise cartId depuis payload.data.id', async () => {
    axiosMock.get.mockResolvedValue({
      data: {
        data: { id: 555, cart_items: [] },
        meta: {},
      },
    });
    await act(() => store.getState().loadCart());
    expect(store.getState().cartId).toBe('555');
  });

  it('ne modifie pas cartId si unchanged', async () => {
    // fixé à "777" avant l'appel
    store.setState({ cartId: '777' });
    axiosMock.get.mockResolvedValue({
      data: {
        data: { id: 777, cart_items: [] },
        meta: {},
      },
    });
    await act(() => store.getState().loadCart());
    expect(store.getState().cartId).toBe('777');
  });

  it('lockCart et unlockCart togglent isLocked', () => {
    store.getState().lockCart();
    expect(store.getState().isLocked).toBe(true);
    store.getState().unlockCart();
    expect(store.getState().isLocked).toBe(false);
  });

  it('setCartId met à jour cartId dans le store', () => {
    expect(store.getState().cartId).toBeNull();
    store.getState().setCartId('ABC');
    expect(store.getState().cartId).toBe('ABC');
  });
});

describe('clearCart → reload fail', () => {
  let store: typeof useCartStore;
  let axiosMock: typeof __mockAxios;

  beforeEach(async () => {
    ({ store, axiosMock } = await resetAndImport());
    axiosMock.delete.mockClear();
    // on remet un token valide dans useAuthStore.getState()
    (useAuthStore.getState as any).mockReturnValue({ authToken: 'TOK' });
    // on vide d’abord le panier pour l’état initial
    store.setState({
      items: [{ 
        id: '1', name: 'X', image: '', date: '', location: '',
        quantity: 1, price: 1, inStock: true,
        availableQuantity: 1, discountRate: null, originalPrice: null 
      }],
      guestCartId: null,
    });
    axiosMock.delete.mockResolvedValue({});
  });

  it('logWarn("clearCart → loadCart") quand reload échoue après delete', async () => {
    // on spy sur loadCart pour qu’il rejette
    const reloadError = new Error('reload failed');
    const spy = vi.spyOn(store.getState(), 'loadCart').mockRejectedValue(reloadError);

    await act(() => store.getState().clearCart());

    // items doivent être vidés malgré tout
    expect(store.getState().items).toEqual([]);
    // on doit avoir logWarn sur le warn de reload
    expect(logWarn).toHaveBeenCalledWith('clearCart → loadCart', reloadError);

    spy.mockRestore();
  });
});

describe('useCartStore – erreurs CartLocked', () => {
  beforeEach(() => {
    // On reset l’état du store avant chaque test
    useCartStore.setState({ isLocked: false, items: [], guestCartId: null, cartId: null });
  });

  it('addItem lève "CartLocked" si le panier est verrouillé', async () => {
    // Verrouille le panier
    useCartStore.getState().lockCart();
    await expect(
      useCartStore.getState().addItem('1', 1, 5)
    ).rejects.toThrow('CartLocked');
  });

  it('clearCart lève "CartLocked" si le panier est verrouillé', async () => {
    // Verrouille le panier
    useCartStore.getState().lockCart();
    await expect(
      useCartStore.getState().clearCart()
    ).rejects.toThrow('CartLocked');
  });
});

describe('useCartStore – couverture de syncCartId', () => {
  it('loadCart synchronise cartId depuis payload.data.id', async () => {
    const { store, axiosMock } = await resetModulesAndImport();
    // Simule une réponse API avec data.id = 555
    axiosMock.get.mockResolvedValue({
      data: {
        meta: {},
        data: { id: 555, cart_items: [] },
      },
    });
    await act(() => store.getState().loadCart());
    expect(store.getState().cartId).toBe('555');
  });

  it('loadCart ne modifie pas cartId si payload.data.id inchangé', async () => {
    const { store, axiosMock } = await resetModulesAndImport();
    // On pré-remplit cartId à '999'
    store.setState({ cartId: '999' });
    axiosMock.get.mockResolvedValue({
      data: {
        meta: {},
        data: { id: 999, cart_items: [] },
      },
    });
    await act(() => store.getState().loadCart());
    expect(store.getState().cartId).toBe('999');
  });
});

describe('useCartStore – edge-cases loadCart sans payload / sans meta / sans data', () => {
  it('skip sync si payload est falsy', async () => {
    const { store, axiosMock } = await resetModulesAndImport();
    // on pré-remplit guestCartId et cartId pour vérifier qu’ils ne changent pas
    store.setState({
      guestCartId: 'OLD_G',
      cartId: 'OLD_C',
      items: [{ id: 'x', name:'X', image:'', date:'', location:'', quantity:1, price:1, inStock:true, availableQuantity:1, discountRate:null, originalPrice:null }]
    });
    // API renvoie un data null => payload falsy
    axiosMock.get.mockResolvedValue({ data: null });
    await act(() => store.getState().loadCart());
    // ni guestCartId ni cartId ne doivent avoir bougé :
    expect(store.getState().guestCartId).toBe('OLD_G');
    expect(store.getState().cartId).toBe('OLD_C');
    // par contre items est toujours réinitialisé à []
    expect(store.getState().items).toEqual([]);
  });

  it('skip syncGuestCartId si meta manquant', async () => {
    const { store, axiosMock } = await resetModulesAndImport();
    // on pré-remplit guestCartId pour vérifier qu’il ne change pas
    store.setState({ guestCartId: 'OLD_G', cartId: null, items: [] });
    // API renvoie un payload sans meta
    axiosMock.get.mockResolvedValue({ data: { data: { cart_items: [] } } });
    await act(() => store.getState().loadCart());
    // guestCartId doit rester inchangé
    expect(store.getState().guestCartId).toBe('OLD_G');
  });

  it('skip syncCartId si data manquant', async () => {
    const { store, axiosMock } = await resetModulesAndImport();
    // on pré-remplit cartId pour vérifier qu’il ne change pas
    store.setState({ guestCartId: null, cartId: 'OLD_C', items: [] });
    // API renvoie un payload sans data
    axiosMock.get.mockResolvedValue({ data: { meta: {} } });
    await act(() => store.getState().loadCart());
    // cartId doit rester inchangé
    expect(store.getState().cartId).toBe('OLD_C');
  });
});

describe('useCartStore – privileged-user guards', () => {
  let store: typeof useCartStore;
  let axiosMock: typeof __mockAxios;

  beforeEach(async () => {
    // reset modules so our interceptors get re-created with fresh mocks
    const { store: freshStore, axiosMock: freshAxios } = await resetModulesAndImport();
    store = freshStore;
    axiosMock = freshAxios;

    // clear any previous state
    store.setState({
      items: [],
      guestCartId: null,
      cartId: null,
      isLocked: false,
    });

    // make sure axiosMock.get/patch/delete are clear
    axiosMock.get.mockClear();
    axiosMock.patch.mockClear();
    axiosMock.delete.mockClear();

    // stub logger mocks
    (logWarn as Mock).mockClear();
  });

  it('loadCart should early-return + warn when role is admin', async () => {
    // simulate admin
    (useAuthStore.getState as Mock).mockReturnValue({ authToken: 'TOK', role: 'admin' });

    await store.getState().loadCart();

    expect(axiosMock.get).not.toHaveBeenCalled();
    expect(logWarn).toHaveBeenCalledWith('loadCart', 'Attempt to load cart by privileged user');
  });

  it('addItem should throw CartLockedForPrivilegedUser when role is employee', async () => {
    (useAuthStore.getState as Mock).mockReturnValue({ authToken: 'TOK', role: 'employee' });

    await expect(store.getState().addItem('1', 1, 5)).rejects.toThrow('CartLockedForPrivilegedUser');
  });

  it('clearCart should throw CartLockedForPrivilegedUser when role is admin', async () => {
    (useAuthStore.getState as Mock).mockReturnValue({ authToken: 'TOK', role: 'admin' });

    await expect(store.getState().clearCart()).rejects.toThrow('CartLockedForPrivilegedUser');
  });
});