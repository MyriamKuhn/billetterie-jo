import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// 1) Stub react-i18next
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

// 2) Stub useLanguageStore (juste pour que le composant se monte)
vi.mock('../stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: vi.fn((sel: any) => sel({ lang: 'en' })),
}));

// 3) Stub useReloadCart pour bypass loader/error/empty
vi.mock('../hooks/useReloadCart', () => ({
  __esModule: true,
  useReloadCart: () => ({ loading: false, hasError: false, reload: () => {} }),
}));

// 4) Stub useCartStore pour items non vides (on veut juste passer au render normal)
vi.mock('../stores/useCartStore', () => {
  function useCartStore(sel: any) {
    return sel({ items: [{ id: '1', quantity: 1, price: 10, availableQuantity: 5 }] });
  }
  useCartStore.getState = () => ({ addItem: () => {} });
  return { __esModule: true, useCartStore };
});

// 5) Stub tous les composants enfants sauf CartSummary
vi.mock('../components/OlympicLoader',   () => ({ __esModule:true, default: () => null }));
vi.mock('../components/Seo',             () => ({ __esModule:true, default: () => null }));
vi.mock('../components/ErrorDisplay',    () => ({ __esModule:true, ErrorDisplay: () => null }));
vi.mock('../components/CartItemDisplay', () => ({ __esModule:true, CartItemDisplay: () => null }));

// 6) Stub CartSummary pour exposer checkbox + bouton
vi.mock('../components/CartSummary', () => ({
  __esModule: true,
  CartSummary: ({ acceptedCGV, onCgvChange, onPay, isMobile }: any) => (
    <div>
      <input
        type="checkbox"
        data-testid="cg-checkbox"
        checked={acceptedCGV}
        onChange={e => onCgvChange(e.target.checked)}
      />
      <button data-testid="pay-button" onClick={onPay}>Pay</button>
      <span data-testid="mobile-summary">{isMobile ? 'yes' : 'no'}</span>
    </div>
  )
}));

// 7) Stub useMediaQuery + theme
vi.mock('@mui/material/useMediaQuery', () => ({ __esModule:true, default: () => false }));
vi.mock('@mui/material/styles', () => ({
  __esModule: true,
  useTheme: () => ({ breakpoints: { down: () => '' }})
}));

// 8) Stub useCustomSnackbar.notify
const mockNotify = vi.fn();
vi.mock('../hooks/useCustomSnackbar', () => ({
  __esModule: true,
  useCustomSnackbar: () => ({ notify: mockNotify })
}));

// 9) Spy useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual('react-router-dom')) as any;
  return { ...actual, useNavigate: () => mockNavigate };
});

// 10) Stub useAuthStore, on surchargera dans tests
import { useAuthStore } from '../stores/useAuthStore';
vi.mock('../stores/useAuthStore', () => ({
  __esModule: true,
  useAuthStore: vi.fn()
}));

import CartPage from './CartPage';

describe('<CartPage /> handlePay', () => {
  beforeEach(() => {
    mockNotify.mockReset();
    mockNavigate.mockReset();
    ;(useAuthStore as any).mockImplementation((selector: any) =>
      selector({ authToken: null })
    );
  });

  it('avertit si CGV non cochées', () => {
    //  useAuthStore doit renvoyer { authToken: null }
    (useAuthStore as any).mockReturnValue({ authToken: null });
    render(<CartPage />, { wrapper: MemoryRouter });

    // CGV non cochées par défaut
    fireEvent.click(screen.getByTestId('pay-button'));
    expect(mockNotify).toHaveBeenCalledWith('cart:cart.cgv_not_accepted', 'warning');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirige vers login si guest et CGV cochées', () => {
    // Simuler guest
    ;(useAuthStore as any).mockImplementation((selector: any) =>
      selector({ authToken: null })
    );

    render(<CartPage />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByTestId('cg-checkbox'));
    fireEvent.click(screen.getByTestId('pay-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/login?next=/cart');
  });

  it('redirige vers checkout si connecté et CGV cochées', () => {
    // Simuler utilisateur connecté
    ;(useAuthStore as any).mockImplementation((sel: any) =>
      sel({ authToken: 'un-token' })
    );

    render(<CartPage />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByTestId('cg-checkbox'));
    fireEvent.click(screen.getByTestId('pay-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });
})
