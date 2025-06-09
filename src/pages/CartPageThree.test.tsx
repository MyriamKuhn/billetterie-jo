import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// ─── 1) MÊMES MOCKS QUE DANS CartPage.additional.test.tsx ───────────────────────

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

// 1.4) CartItemDisplay stub (ligne de tableau)
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
        <button
          data-testid={`same-${item.id}`}
          onClick={() => adjustQty(item, item.quantity)}
        >
          Same
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
        onChange={e => onCgvChange((e.target as HTMLInputElement).checked)}
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

// 1.8) useTranslation stub
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => {
      if (key.includes('error_update')) return 'error_update';
      if (key.includes('update_success')) return 'update_success';
      return key;
    },
  }),
}));

// 1.9) useLanguageStore stub
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

// 1.11) useCartStore stub AVEC getState et items
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

// ─── 3) SUITE DE TESTS ADDITIONNELS ───────────────────────────────────────────
describe('<CartPage /> – couverture des branches manquantes', () => {
  beforeEach(() => {
    mockNotify.mockReset();
    mockAddItem.mockReset();
    mockReload.mockReset();
    mockItems.length = 0;
    mockReloadState = { loading: false, hasError: false };
    (useMediaQuery as any).mockReturnValue(false);
  });

  it('adjustQty : newQty < 0 devient 0 et déclenche update_success', async () => {
    // Simuler un item dont quantity = 0
    mockItems.push({ id: '1', price: 5, quantity: 0, availableQuantity: 5 });
    render(<CartPage />, { wrapper: MemoryRouter });

    // Cliquer sur le bouton "dec" → newQty = -1, mais interne setter met newQty = 0
    await act(async () => {
      fireEvent.click(screen.getByTestId('dec-1'));
    });

    // On appelle addItem('1', 0, 5) et on notifie "update_success"
    expect(mockAddItem).toHaveBeenCalledWith('1', 0, 5);
    expect(mockNotify).toHaveBeenCalledWith('update_success', 'info');
  });

  it('calcul de total via useMemo reflète plusieurs items', () => {
    // Deux items pour tester reduce
    mockItems.push({ id: '1', price: 2, quantity: 3, availableQuantity: 10 });
    mockItems.push({ id: '2', price: 4, quantity: 1, availableQuantity: 10 });
    render(<CartPage />, { wrapper: MemoryRouter });

    // Total attendu = 2*3 + 4*1 = 10
    expect(screen.getByTestId('total')).toHaveTextContent('10');
  });

  it('isMobile détecté via useMediaQuery rend la version mobile', () => {
    // On force isMobile = true
    (useMediaQuery as any).mockReturnValue(true);
    mockItems.push({ id: '5', price: 7, quantity: 2, availableQuantity: 10 });
    render(<CartPage />, { wrapper: MemoryRouter });

    // Le stub CartItemDisplay affiche mobile="yes"
    expect(screen.getByTestId('mobile-5')).toHaveTextContent('yes');
    // Et le résumé mobile
    expect(screen.getByTestId('mobile-summary')).toHaveTextContent('yes');
  });
});
