import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// ─── 1) MOCK DES DÉPENDANCES ─────────────────────────────────────────────────

// 1.1) OlympicLoader stub
vi.mock('../components/OlympicLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

// 1.2) Seo stub
vi.mock('../components/Seo', () => ({
  __esModule: true,
  default: ({ title, description }: any) => (
    <div data-testid="seo" data-title={title} data-desc={description} />
  ),
}));

// 1.3) ErrorDisplay stub
vi.mock('../components/ErrorDisplay', () => ({
  __esModule: true,
  ErrorDisplay: ({ title, message, showRetry, showHome }: any) => (
    <div
      data-testid="error-display"
      data-title={title}
      data-message={message}
      data-retry={showRetry}
      data-home={showHome}
    />
  ),
}));

// 1.4) CartItemDisplay stub (on renvoie un <tr> valide dans un <tbody>)
vi.mock('../components/CartItemDisplay', () => ({
  __esModule: true,
  CartItemDisplay: ({ item, adjustQty, isMobile }: any) => (
    <tr data-testid={`item-${item.id}`}>
      <td>
        <span data-testid={`qty-${item.id}`}>{item.quantity}</span>
      </td>
      <td>
        <span data-testid={`price-${item.id}`}>{item.price}</span>
      </td>
      <td>
        <span data-testid={`avail-${item.id}`}>{item.availableQuantity}</span>
      </td>
      <td>
        <button
          data-testid={`inc-${item.id}`}
          onClick={() => adjustQty(item, item.quantity + 1)}
        >
          Inc
        </button>
        <button
          data-testid={`dec-${item.id}`}
          onClick={() => adjustQty(item, item.quantity - 1)}
        >
          Dec
        </button>
        <button
          data-testid={`overflow-${item.id}`}
          onClick={() => adjustQty(item, item.availableQuantity + 1)}
        >
          Overflow
        </button>
        <span data-testid={`mobile-${item.id}`}>
          {isMobile ? 'yes' : 'no'}
        </span>
      </td>
    </tr>
  ),
}));

// 1.5) CartSummary stub
vi.mock('../components/CartSummary', () => ({
  __esModule: true,
  CartSummary: ({ total, acceptedCGV, onCgvChange, onPay, isMobile }: any) => (
    <div data-testid="summary">
      <span data-testid="total">{total}</span>
      <input
        type="checkbox"
        data-testid="cg-checkbox"
        checked={acceptedCGV}
        onChange={e => onCgvChange(e.target.checked)}
      />
      <button data-testid="pay-button" onClick={onPay}>
        Pay
      </button>
      <span data-testid="mobile-summary">{isMobile ? 'yes' : 'no'}</span>
    </div>
  ),
}));

// 1.6) useMediaQuery & useTheme stubs
import useMediaQuery from '@mui/material/useMediaQuery';
vi.mock('@mui/material/useMediaQuery');
vi.mock('@mui/material/styles', () => ({
  __esModule: true,
  useTheme: () => ({ breakpoints: { down: () => '(max-width:600px)' } }),
}));

// 1.7) useCustomSnackbar stub
const mockNotify = vi.fn();
vi.mock('../hooks/useCustomSnackbar', () => ({
  __esModule: true,
  useCustomSnackbar: () => ({ notify: mockNotify }),
}));

// 1.8) useTranslation stub (ordre : “*_message” avant “*_error”)
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      // Cas précis à vérifier avant d’autres “includes”
      if (key.includes('error_loading_message')) return 'error_loading_message';
      if (key.includes('error_loading')) return 'error_loading';

      if (key.includes('empty_message')) return 'empty_message';
      if (key.includes('empty')) return 'empty';

      if (key.includes('checkout_not_implemented')) return 'checkout_not_implemented';
      if (key.includes('not_enough_stock')) return `not_enough:${opts.count}`;

      if (key.includes('add_success')) return 'add_success';
      if (key.includes('remove_success')) return 'remove_success';
      if (key.includes('update_success')) return 'update_success';
      if (key.includes('error_update')) return 'error_update';

      // Fallback à la clé complète
      return key;
    },
  }),
}));

// 1.9) useLanguageStore stub
import { useLanguageStore } from '../stores/useLanguageStore';
vi.mock('../stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: vi.fn(() => 'en'),
}));

// 1.10) useReloadCart stub
const mockReload = vi.fn();
let mockReloadState: { loading: boolean; hasError: boolean } = {
  loading: false,
  hasError: false,
};
vi.mock('../hooks/useReloadCart', () => ({
  __esModule: true,
  useReloadCart: () => ({
    loading: mockReloadState.loading,
    hasError: mockReloadState.hasError,
    reload: mockReload,
  }),
}));

// 1.11) useCartStore stub AVEC getState
const mockItems: any[] = [];
const mockAddItem = vi.fn();
vi.mock('../stores/useCartStore', () => {
  function store(selector: any) {
    return selector({ items: mockItems });
  }
  store.getState = () => ({ addItem: mockAddItem });
  return {
    __esModule: true,
    useCartStore: store,
  };
});

// ─── 2) IMPORT DU COMPOSANT SOUS TEST ──────────────────────────────────────────
import CartPage from './CartPage';

// ─── 3) SUITE DE TESTS ─────────────────────────────────────────────────────────
describe('<CartPage />', () => {
  beforeEach(() => {
    mockNotify.mockReset();
    mockAddItem.mockReset();
    mockReload.mockReset();
    mockItems.length = 0;
    mockReloadState = { loading: false, hasError: false };
    // Par défaut on simule desktop (useMediaQuery=false)
    (useMediaQuery as any).mockReturnValue(false);
  });

  it('rend le loader quand loading = true', () => {
    mockReloadState.loading = true;
    render(<CartPage />, { wrapper: MemoryRouter });
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('rend l’écran d’erreur quand hasError = true', () => {
    mockReloadState.hasError = true;
    render(<CartPage />, { wrapper: MemoryRouter });
    const err = screen.getByTestId('error-display');
    expect(err).toHaveAttribute('data-title', 'error_loading');
    expect(err).toHaveAttribute('data-message', 'error_loading_message');
    expect(err).toHaveAttribute('data-retry', 'true');
    expect(err).toHaveAttribute('data-home', 'true');
  });

  it('rend le message de panier vide si items = [] et pas d’erreur ni loading', () => {
    mockItems.length = 0;
    render(<CartPage />, { wrapper: MemoryRouter });
    const err = screen.getByTestId('error-display');
    expect(err).toHaveAttribute('data-title', 'empty');
    expect(err).toHaveAttribute('data-message', 'empty_message');
    expect(err).toHaveAttribute('data-retry', 'false');
    expect(err).toHaveAttribute('data-home', 'true');
  });

  it('rend la table (desktop) avec items et le résumé', () => {
    mockItems.push({ id: '1', price: 10, quantity: 2, availableQuantity: 5, name: 'X' });
    mockItems.push({ id: '2', price: 3, quantity: 1, availableQuantity: 2, name: 'Y' });
    render(<CartPage />, { wrapper: MemoryRouter });

    // On doit voir les en-têtes (les clés brutes “cart:table...” sont renvoyées par t())
    expect(screen.getByText('cart:table.product')).toBeInTheDocument();
    expect(screen.getByText('cart:table.unit_price')).toBeInTheDocument();
    expect(screen.getByText('cart:table.quantity')).toBeInTheDocument();
    expect(screen.getByText('cart:cart.total')).toBeInTheDocument();

    // Les deux lignes (tr) sont bien là
    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();

    // Total = 10*2 + 3*1 = 23
    expect(screen.getByTestId('total')).toHaveTextContent('23');
    // En desktop, summary mobile = "no"
    expect(screen.getByTestId('mobile-summary')).toHaveTextContent('no');
  });

  it('rend les “cartes” (mobile) quand useMediaQuery retourne true', () => {
    (useMediaQuery as any).mockReturnValue(true);
    mockItems.push({ id: '3', price: 7, quantity: 3, availableQuantity: 10, name: 'Z' });
    render(<CartPage />, { wrapper: MemoryRouter });
    // Notre stub affiche <span data-testid="mobile-3">yes</span>
    expect(screen.getByTestId('mobile-3')).toHaveTextContent('yes');
    expect(screen.getByTestId('mobile-summary')).toHaveTextContent('yes');
  });

  it('adjustQty : incrémenter dans les limites appelle addItem et affiche “add_success”', async () => {
    mockItems.push({ id: '1', price: 5, quantity: 1, availableQuantity: 3, name: 'A' });
    render(<CartPage />, { wrapper: MemoryRouter });
    await act(async () => {
      fireEvent.click(screen.getByTestId('inc-1'));
    });
    expect(mockAddItem).toHaveBeenCalledWith('1', 2, 3);
    expect(mockNotify).toHaveBeenCalledWith('add_success', 'success');
  });

  it('adjustQty : décrémenter appelle addItem puis “remove_success”', async () => {
    mockItems.push({ id: '1', price: 5, quantity: 2, availableQuantity: 5, name: 'A' });
    render(<CartPage />, { wrapper: MemoryRouter });
    await act(async () => {
      fireEvent.click(screen.getByTestId('dec-1'));
    });
    expect(mockAddItem).toHaveBeenCalledWith('1', 1, 5);
    expect(mockNotify).toHaveBeenCalledWith('remove_success', 'success');
  });

  it('adjustQty : overflow (quantité > disponible) affiche “not_enough” et n’appelle pas addItem', () => {
    mockItems.push({ id: '1', price: 5, quantity: 2, availableQuantity: 2, name: 'A' });
    render(<CartPage />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByTestId('overflow-1'));
    expect(mockAddItem).not.toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith('not_enough:2', 'warning');
  });

  it('adjustQty : si addItem rejette, affiche “error_update”', async () => {
    mockItems.push({ id: '1', price: 5, quantity: 1, availableQuantity: 5, name: 'A' });
    mockAddItem.mockRejectedValue(new Error('fail'));
    render(<CartPage />, { wrapper: MemoryRouter });
    await act(async () => {
      fireEvent.click(screen.getByTestId('inc-1'));
    });
    expect(mockNotify).toHaveBeenCalledWith('error_update', 'error');
  });

  it('clic sur “Pay” sans avoir accepté les CGV affiche un warning CGV', () => {
    mockItems.push({ id: '1', price: 5, quantity: 1, availableQuantity: 5, name: 'A' });
    render(<CartPage />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByTestId('pay-button'));
    // on n'a pas coché la CGV → on doit voir notre message de cgv_not_accepted
    expect(mockNotify).toHaveBeenCalledWith('cart:cart.cgv_not_accepted', 'warning');
  });

  it('appel de reload au montage et quand la langue change', () => {
    // 1) Premier render → reload() appelé une fois
    render(<CartPage />, { wrapper: MemoryRouter });
    expect(mockReload).toHaveBeenCalledTimes(1);

    // 2) On simule un changement de langue via le même hook mocké
    (useLanguageStore as any).mockReturnValue('fr');
    render(<CartPage />, { wrapper: MemoryRouter });
    expect(mockReload).toHaveBeenCalledTimes(2);
  });
});
