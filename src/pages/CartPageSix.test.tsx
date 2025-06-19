// src/pages/CartPage.test.tsx
import { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CartPage from './CartPage';
import { useCartStore } from '../stores/useCartStore';

// Import des composants mockés pour override leurs implémentations
import { CartItemDisplay } from '../components/CartItemDisplay';
import { CartSummary } from '../components/CartSummary';

// ─── Mocks globaux ─────────────────────────────────────────────────────────────
// 1. Mock react-i18next useTranslation
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      opts && typeof opts.count !== 'undefined' ? `${key}:${opts.count}` : key,
  }),
}));

// 2. Mock useLanguageStore
vi.mock('../stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: (selector: any) => selector({ lang: 'en' }),
}));

// 3. Mock useReloadCart
let mockReload = vi.fn();
let mockLoading = false;
let mockHasError = false;
vi.mock('../hooks/useReloadCart', () => ({
  __esModule: true,
  useReloadCart: () => ({
    loading: mockLoading,
    hasError: mockHasError,
    reload: mockReload,
  }),
}));

// 4. Mock useCartStore
vi.mock('../stores/useCartStore', () => {
  const useCartStoreMock = vi.fn();
  (useCartStoreMock as any).getState = vi.fn();
  return {
    __esModule: true,
    useCartStore: useCartStoreMock,
  };
});

// 5. Mock useAuthStore
let mockAuthToken: string | null = 'token';
vi.mock('../stores/useAuthStore', () => ({
  __esModule: true,
  useAuthStore: (selector: any) => selector({ authToken: mockAuthToken }),
}));

// 6. Mock useCustomSnackbar
const mockNotify = vi.fn();
vi.mock('../hooks/useCustomSnackbar', () => ({
  __esModule: true,
  useCustomSnackbar: () => ({ notify: mockNotify }),
}));

// 7. Mock react-router-dom useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual: any = await vi.importActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// 8. Mock child components: Seo, OlympicLoader, ErrorDisplay, PageWrapper, CartItemDisplay, CartSummary
vi.mock('../components/Seo', () => ({
  __esModule: true,
  default: ({ title, description }: any) => (
    <div data-testid="seo" data-title={title} data-description={description} />
  ),
}));
vi.mock('../components/OlympicLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader">Loading...</div>,
}));
vi.mock('../components/ErrorDisplay', () => ({
  __esModule: true,
  ErrorDisplay: ({ title, message, showRetry, retryButtonText, onRetry, showHome, homeButtonText }: any) => (
    <div data-testid="error-display">
      <div data-testid="error-title">{title}</div>
      <div data-testid="error-message">{message}</div>
      {showRetry && <button data-testid="retry-button" onClick={onRetry}>{retryButtonText}</button>}
      {showHome && <button data-testid="home-button">{homeButtonText}</button>}
    </div>
  ),
}));
vi.mock('../components/PageWrapper', () => ({
  __esModule: true,
  PageWrapper: ({ children }: any) => <div data-testid="page-wrapper">{children}</div>,
}));
// On mocke CartItemDisplay et CartSummary globalement; leurs implémentations seront overridées dans les tests
vi.mock('../components/CartItemDisplay', () => ({
  __esModule: true,
  CartItemDisplay: vi.fn((props: any) => <div data-testid="cart-item-display">{props.item?.id}</div>),
}));
vi.mock('../components/CartSummary', () => ({
  __esModule: true,
  CartSummary: vi.fn(() => <div data-testid="cart-summary" />),
}));

// ─── Helper to setup useCartStore mocks ─────────────────────────────────────────
// Configure le hook et getState pour return storeItems et storeIsLocked
function setupUseCartStoreMocks(storeItems: any[], storeIsLocked: boolean, mockAddItem: ReturnType<typeof vi.fn>) {
  (useCartStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
    const state = { items: storeItems, isLocked: storeIsLocked };
    return selector(state);
  });
  (useCartStore as any).getState.mockReturnValue({
    addItem: mockAddItem,
    isLocked: storeIsLocked,
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────────
describe('CartPage', () => {
  const mockAddItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global mocks state
    mockLoading = false;
    mockHasError = false;
    mockReload = vi.fn();
    mockAuthToken = 'token';
    mockNavigate.mockReset();
    mockNotify.mockReset();
    mockAddItem.mockReset();
    // Par défaut, panier vide et unlocked
    setupUseCartStoreMocks([], false, mockAddItem);
  });

  it('shows loader when loading=true', () => {
    mockLoading = true;
    setupUseCartStoreMocks([], false, mockAddItem);
    const { getByTestId } = render(<CartPage />);
    expect(getByTestId('seo')).toBeInTheDocument();
    expect(getByTestId('loader')).toBeInTheDocument();
  });

  it('shows error when hasError=true', () => {
    mockHasError = true;
    setupUseCartStoreMocks([], false, mockAddItem);
    const { getByTestId } = render(<CartPage />);
    expect(getByTestId('error-display')).toBeInTheDocument();
    expect(getByTestId('error-title')).toBeInTheDocument();
  });

  it('shows empty message when items empty', () => {
    setupUseCartStoreMocks([], false, mockAddItem);
    const { getByTestId } = render(<CartPage />);
    expect(getByTestId('error-display')).toBeInTheDocument();
    expect(getByTestId('error-title')).toHaveTextContent('cart:cart.empty');
  });

  it('adjustQty: notifies cart_locked when isLocked=true via CartItemDisplay callback', () => {
    const item = { id: 'i1', quantity: 2, price: 10, availableQuantity: 5 };
    setupUseCartStoreMocks([item], true, mockAddItem);

    // Override CartItemDisplay mock implementation
    (CartItemDisplay as unknown as ReturnType<typeof vi.fn>).mockImplementation((props: any) => {
      const { item: passedItem, adjustQty } = props;
      useEffect(() => {
        adjustQty(passedItem, passedItem.quantity + 1);
      }, [adjustQty, passedItem]);
      return <div data-testid="cart-item-display">{passedItem.id}</div>;
    });

    render(<CartPage />);

    expect(mockNotify).toHaveBeenCalledWith('cart:errors.cart_locked', 'warning');
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it('adjustQty: notifies cart_locked in catch when addItem rejects with message "CartLocked"', async () => {
    const item = { id: 'i2', quantity: 2, price: 10, availableQuantity: 5 };
    setupUseCartStoreMocks([item], false, mockAddItem);
    mockAddItem.mockRejectedValueOnce(Object.assign(new Error('err'), { message: 'CartLocked' }));

    // Override CartItemDisplay pour appeler adjustQty au montage
    (CartItemDisplay as unknown as ReturnType<typeof vi.fn>).mockImplementation((props: any) => {
      const { item: passedItem, adjustQty } = props;
      useEffect(() => {
        // appeler adjustQty asynchrone
        adjustQty(passedItem, passedItem.quantity + 1);
      }, [adjustQty, passedItem]);
      return <div data-testid="cart-item-display">{passedItem.id}</div>;
    });

    render(<CartPage />);

    // Attendre que mockAddItem et mockNotify soient appelés
    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith('i2', 3, 5);
      expect(mockNotify).toHaveBeenCalledWith('cart:errors.cart_locked', 'warning');
    });
  });

  it('handlePay: notifies cart_locked when isLocked=true via CartSummary callback', () => {
    const item = { id: 'i3', quantity: 1, price: 10, availableQuantity: 5 };
    setupUseCartStoreMocks([item], true, mockAddItem);

    (CartItemDisplay as unknown as ReturnType<typeof vi.fn>).mockImplementation((props: any) => {
      return <div data-testid="cart-item-display">{props.item.id}</div>;
    });
    (CartSummary as unknown as ReturnType<typeof vi.fn>).mockImplementation((props: any) => {
      const { onPay } = props;
      useEffect(() => {
        onPay();
      }, [onPay]);
      return <div data-testid="cart-summary" />;
    });

    render(<CartPage />);

    expect(mockNotify).toHaveBeenCalledWith('cart:errors.cart_locked', 'warning');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handlePay: notifies cgv_not_accepted when !acceptedCGV and !isLocked', () => {
    const item = { id: 'i4', quantity: 1, price: 10, availableQuantity: 5 };
    setupUseCartStoreMocks([item], false, mockAddItem);
    mockAuthToken = null;

    (CartItemDisplay as unknown as ReturnType<typeof vi.fn>).mockImplementation((props: any) => {
      return <div data-testid="cart-item-display">{props.item.id}</div>;
    });
    (CartSummary as unknown as ReturnType<typeof vi.fn>).mockImplementation((props: any) => {
      const { onPay } = props;
      useEffect(() => {
        onPay();
      }, [onPay]);
      return <div data-testid="cart-summary" />;
    });

    render(<CartPage />);

    expect(mockNotify).toHaveBeenCalledWith('cart:cart.cgv_not_accepted', 'warning');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handlePay: redirects to login?next=/cart when acceptedCGV=true, !isLocked, no token', () => {
    const item = { id: 'i5', quantity: 1, price: 10, availableQuantity: 5 };
    setupUseCartStoreMocks([item], false, mockAddItem);
    mockAuthToken = null;

    (CartItemDisplay as unknown as ReturnType<typeof vi.fn>).mockImplementation((props: any) => {
      return <div data-testid="cart-item-display">{props.item.id}</div>;
    });
    (CartSummary as unknown as ReturnType<typeof vi.fn>).mockImplementation((props: any) => {
      const { onCgvChange, onPay } = props;
      useEffect(() => {
        onCgvChange(true);
        onPay();
      }, [onCgvChange, onPay]);
      return <div data-testid="cart-summary" />;
    });

    render(<CartPage />);

    expect(mockNavigate).toHaveBeenCalledWith('/login?next=/cart');
  });

  it('handlePay: redirects to /checkout when acceptedCGV=true, !isLocked, token present', () => {
    const item = { id: 'i6', quantity: 1, price: 10, availableQuantity: 5 };
    setupUseCartStoreMocks([item], false, mockAddItem);
    mockAuthToken = 'token123';

    (CartItemDisplay as unknown as ReturnType<typeof vi.fn>).mockImplementation((props: any) => {
      return <div data-testid="cart-item-display">{props.item.id}</div>;
    });
    (CartSummary as unknown as ReturnType<typeof vi.fn>).mockImplementation((props: any) => {
      const { onCgvChange, onPay } = props;
      useEffect(() => {
        onCgvChange(true);
        onPay();
      }, [onCgvChange, onPay]);
      return <div data-testid="cart-summary" />;
    });

    render(<CartPage />);

    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });
});
