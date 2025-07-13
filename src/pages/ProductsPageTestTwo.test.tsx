import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

describe('<ProductsPage /> onBuy', () => {
  let mockUseAddToCart: ReturnType<typeof vi.fn>;
  let mockUseCartStoreState: { items: any[] };
  let mockUseCartStore: { getState: () => { items: any[] } };

  beforeAll(() => {
    vi.resetModules();

    // 1) Mock useAddToCart
    mockUseAddToCart = vi.fn();
    vi.doMock('../hooks/useAddToCart', () => ({
      __esModule: true,
      useAddToCart: () => mockUseAddToCart,
    }));

    // 2) Prepare a mutable state for useCartStore
    mockUseCartStoreState = { items: [] };
    mockUseCartStore = {
      getState: () => ({ items: mockUseCartStoreState.items }),
    };
    vi.doMock('../stores/useCartStore', () => ({
      __esModule: true,
      useCartStore: vi.fn((selector: any) => selector(mockUseCartStore.getState())),
    }));

    // 3) Mock useProducts for a single product {id:5, stock_quantity:10}
    const mockUseProducts = vi
      .fn()
      .mockReturnValue({ products: [{ id: 5, stock_quantity: 10 }], total: 1, loading: false, error: null, validationErrors: null });
    vi.doMock('../hooks/useProducts', () => ({
      __esModule: true,
      useProducts: (...args: any[]) => mockUseProducts(...args),
    }));

    // 4) Mock child components lightly
    vi.doMock('../components/OlympicLoader', () => ({ __esModule: true, default: () => null }));
    vi.doMock('../components/Seo', () => ({ __esModule: true, default: () => null }));
    vi.doMock('../components/PageWrapper', () => ({
      __esModule: true,
      PageWrapper: ({ children }: any) => <div>{children}</div>,
    }));
    vi.doMock('../components/ProductsFilters', () => ({
      __esModule: true,
      ProductsFilters: ({ filters, onChange }: any) => (
        <div>
          <div data-props={JSON.stringify(filters)} />
          <button data-testid="apply-filter" onClick={() => onChange({ page: 2 })} />
        </div>
      ),
    }));
    // 5) Mock ProductGrid to expose a buy button
    vi.doMock('../components/ProductGrid', () => ({
      __esModule: true,
      ProductGrid: ({ products, onBuy }: any) => (
        <div>
          {products.map((p: any) => (
            <button key={p.id} data-testid={`buy-${p.id}`} onClick={() => onBuy(p)}>
              buy-{p.id}
            </button>
          ))}
        </div>
      ),
    }));
    vi.doMock('../components/ErrorDisplay', () => ({ __esModule: true, ErrorDisplay: () => null }));
    vi.doMock('../components/ProductDetailsModal', () => ({
      __esModule: true,
      ProductDetailsModal: ({ open, productId }: any) => (
        <div data-testid="modal" data-open={open ? 'true' : 'false'} data-productid={productId?.toString() ?? ''} />
      ),
    }));
    vi.doMock('@mui/material/Box', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
    vi.doMock('@mui/material/Pagination', () => ({ __esModule: true, default: () => null }));
    vi.doMock('@mui/material/Typography', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
  });

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    // Reset cart state before each test
    mockUseCartStoreState.items = [];
  });

  it('ne ferme pas le modal si addToCart renvoie true et cart vide', async () => {
    mockUseAddToCart.mockResolvedValue(true);
    const { default: ProductsPage } = await import('./ProductsPage');
    render(<ProductsPage />);

    // Modal initialement fermé
    let modal = screen.getByTestId('modal');
    expect(modal).toHaveAttribute('data-open', 'false');

    // Cliquer sur buy-5
    fireEvent.click(screen.getByTestId('buy-5'));

    await waitFor(() => {
      expect(mockUseAddToCart).toHaveBeenCalledWith('5', 1, 10);
    });

    modal = screen.getByTestId('modal');
    expect(modal).toHaveAttribute('data-open', 'false');
  });

  it('le modal reste fermé si addToCart renvoie false et cart vide', async () => {
    mockUseAddToCart.mockResolvedValue(false);
    const { default: ProductsPage } = await import('./ProductsPage');
    render(<ProductsPage />);

    let modal = screen.getByTestId('modal');
    expect(modal).toHaveAttribute('data-open', 'false');

    fireEvent.click(screen.getByTestId('buy-5'));

    await waitFor(() => {
      expect(mockUseAddToCart).toHaveBeenCalledWith('5', 1, 10);
    });

    modal = screen.getByTestId('modal');
    expect(modal).toHaveAttribute('data-open', 'false');
  });

  it('calcule la nouvelle quantité si un item existe déjà dans le panier', async () => {
    // Arrange : simuler qu’un item existe déjà avec quantité=2
    mockUseCartStoreState.items = [{ id: '5', quantity: 2 }];
    mockUseAddToCart.mockResolvedValue(true);

    const { default: ProductsPage } = await import('./ProductsPage');
    render(<ProductsPage />);

    // Cliquer sur buy-5
    fireEvent.click(screen.getByTestId('buy-5'));

    // Attendre l’appel à addToCart avec newQty = 2+1 = 3
    await waitFor(() => {
      expect(mockUseAddToCart).toHaveBeenCalledWith('5', 3, 10);
    });

    // Le modal reste fermé
    const modal = screen.getByTestId('modal');
    expect(modal).toHaveAttribute('data-open', 'false');
  });
});
