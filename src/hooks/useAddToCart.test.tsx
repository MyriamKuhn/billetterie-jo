import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEffect } from 'react';
import { useAddToCart } from './useAddToCart';
import { useCartStore } from '../stores/useCartStore'; // importer pour pouvoir surcharger getState

// ─── Mocks ────────────────────────────────────────────────────────────────────────
// 1) Mock useCartStore.getState().addItem est défini initialement, on le réaffectera dans les tests
const mockAddItem = vi.fn();
vi.mock('../stores/useCartStore', () => ({
  __esModule: true,
  useCartStore: {
    getState: () => ({ addItem: mockAddItem }),
  },
}));

// 2) Mock useCustomSnackbar
const mockNotify = vi.fn();
vi.mock('./useCustomSnackbar', () => ({
  __esModule: true,
  useCustomSnackbar: () => ({ notify: mockNotify }),
}));

// 3) Mock react-i18next useTranslation
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      opts && opts.count !== undefined ? `${key}:${opts.count}` : key,
  }),
}));

// ─── Helper Test Component to grab the hook’s returned function ─────────────────
function HookRunner({ onReady }: { onReady: (fn: (id: string, d: number, a: number) => Promise<boolean>) => void }) {
  const addToCart = useAddToCart();
  useEffect(() => {
    onReady(addToCart);
  }, [addToCart, onReady]);
  return null;
}

describe('useAddToCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Remettre mockAddItem par défaut
    mockAddItem.mockReset();
    mockNotify.mockReset();
    // Par défaut getState renvoie seulement addItem, isLocked sera undefined/falsy
    (useCartStore.getState as any) = () => ({ addItem: mockAddItem });
  });

  it('renvoie true et notifie succès quand addItem réussit', async () => {
    mockAddItem.mockResolvedValueOnce(undefined);

    let hookFn: (id: string, desiredQty: number, availableQty: number) => Promise<boolean> = async () => false;
    render(<HookRunner onReady={(fn) => (hookFn = fn)} />);

    const result = await hookFn('prod1', 3, 5);
    expect(result).toBe(true);
    expect(mockAddItem).toHaveBeenCalledWith('prod1', 3, 5);
    expect(mockNotify).toHaveBeenCalledWith('cart.add_success', 'success');
  });

  it('renvoie false et notifie warning quand addItem rejette avec "exceeds"', async () => {
    mockAddItem.mockRejectedValueOnce(new Error('Quantity exceeds stock'));

    let hookFn: (id: string, desiredQty: number, availableQty: number) => Promise<boolean> = async () => false;
    render(<HookRunner onReady={(fn) => (hookFn = fn)} />);

    const result = await hookFn('prod2', 10, 5);
    expect(result).toBe(false);
    expect(mockAddItem).toHaveBeenCalledWith('prod2', 10, 5);
    expect(mockNotify).toHaveBeenCalledWith('cart.not_enough_stock:5', 'warning');
  });

  it('renvoie false et notifie erreur quand addItem rejette autrement', async () => {
    mockAddItem.mockRejectedValueOnce(new Error('Network failure'));

    let hookFn: (id: string, desiredQty: number, availableQty: number) => Promise<boolean> = async () => false;
    render(<HookRunner onReady={(fn) => (hookFn = fn)} />);

    const result = await hookFn('prod3', 1, 2);
    expect(result).toBe(false);
    expect(mockAddItem).toHaveBeenCalledWith('prod3', 1, 2);
    expect(mockNotify).toHaveBeenCalledWith('errors.error_update', 'error');
  });

  it('renvoie false et notifie cart_locked quand isLocked=true', async () => {
    // Surcharger getState pour inclure isLocked=true
    (useCartStore.getState as any) = () => ({ addItem: mockAddItem, isLocked: true });

    // Même si addItem résoudrait, on ne doit pas l’appeler
    mockAddItem.mockResolvedValueOnce(undefined);

    let hookFn: (id: string, desiredQty: number, availableQty: number) => Promise<boolean> = async () => true;
    render(<HookRunner onReady={(fn) => (hookFn = fn)} />);

    const result = await hookFn('prodLocked', 2, 5);
    expect(result).toBe(false);
    // addItem NE DOIT PAS ÊTRE APPELÉ
    expect(mockAddItem).not.toHaveBeenCalled();
    // Notification de verrouillage du panier
    expect(mockNotify).toHaveBeenCalledWith('errors.cart_locked', 'warning');
  });
});
