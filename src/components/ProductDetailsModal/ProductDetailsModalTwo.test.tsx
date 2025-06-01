// src/components/ProductDetailsModal/ProductDetailsModalTwo.test.tsx
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductDetailsModal } from './ProductDetailsModal';

// 0️⃣ Mock react-i18next (incluant initReactI18next)
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    initReactI18next: { type: '3rdParty', init: () => {} },
    useTranslation: () => ({
      t: (key: string, opts?: any) =>
        opts && opts.count !== undefined ? `${key}:${opts.count}` : key.replace(/.*\./, ''),
    }),
  };
});

// 1️⃣ Mock useProductDetails
const useProductDetails = vi.fn();
vi.mock('../../hooks/useProductDetails', () => ({
  useProductDetails: (...args: any[]) => useProductDetails(...args),
}));

// 2️⃣ Mock utils/format
vi.mock('../../utils/format', () => ({
  formatCurrency: (v: number) => `$${v.toFixed(2)}`,
  formatDate: (s?: string) => (s ? `Date:${s}` : ''),
}));

// 3️⃣ Mock children
vi.mock('./../OlympicLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));
vi.mock('../ErrorDisplay', () => ({
  __esModule: true,
  ErrorDisplay: () => <div data-testid="error-display" />,
}));

// 4️⃣ Mock useCartStore
const useCartStore = vi.fn();
vi.mock('../../stores/useCartStore', () => ({
  __esModule: true,
  useCartStore: (selector: any) => selector({ items: useCartStore() }),
}));

// 5️⃣ Mock useAddToCart
const mockAddToCart = vi.fn();
vi.mock('../../hooks/useAddToCart', () => ({
  __esModule: true,
  useAddToCart: () => mockAddToCart,
}));

describe('<ProductDetailsModal /> – couverture des branches dateStr, soldOut, finalPrice, handleBuy', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    useProductDetails.mockReset();
    useCartStore.mockReset();
    mockAddToCart.mockReset();
    cleanup();
  });

  it('affiche dateStr + time, prix original et final, chip et available when in stock with sale', async () => {
    const product = {
      id: 7,
      name: 'PromoProd',
      price: 100,
      sale: 0.2,
      stock_quantity: 4,
      product_details: {
        date: '2025-09-09',
        time: '14:00',
        image: 'img7.jpg',
        location: 'Loc7',
        category: 'Cat7',
        description: 'Desc7',
        places: 10,
      },
    } as any;

    useProductDetails.mockReturnValue({ product, loading: false, error: null });
    useCartStore.mockReturnValue([]); // panier vide
    mockAddToCart.mockResolvedValue(true);

    render(<ProductDetailsModal open={true} productId={7} lang="en" onClose={onClose} />);

    // dateStr avec time
    expect(screen.getByText('Date:2025-09-09 – 14:00')).toBeInTheDocument();
    // prix original barré
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    // prix final = 100 * (1-0.2) = 80
    expect(screen.getByText('$80.00')).toBeInTheDocument();
    // badge “–20%”
    expect(screen.getByText(/20%/)).toBeInTheDocument();
    // available (stock_quantity 4)
    expect(screen.getByText('ticket:tickets.available:4')).toBeInTheDocument();

    // Bouton “buy” actif
    const buyButton = screen.getByRole('button', { name: 'buy' });
    expect(buyButton).toBeEnabled();

    // Cliquer pour acheter et attendre handleBuy async
    await act(async () => {
      fireEvent.click(buyButton);
    });

    // newQty = 1
    expect(mockAddToCart).toHaveBeenCalledWith('7', 1, 4);
    // onClose doit être appelé
    expect(onClose).toHaveBeenCalled();
  });

  it('affiche dateStr sans time, finalPrice barré, soldOut, bouton disabled', () => {
    const product = {
      id: 8,
      name: 'SoldOutProd',
      price: 50,
      sale: 0.5,
      stock_quantity: 0,
      product_details: {
        date: '2025-12-12',
        time: '', // pas de time
        image: 'img8.jpg',
        location: 'Loc8',
        category: 'Cat8',
        description: 'Desc8',
        places: 0,
      },
    } as any;

    useProductDetails.mockReturnValue({ product, loading: false, error: null });
    useCartStore.mockReturnValue([]); // panier vide

    render(<ProductDetailsModal open={true} productId={8} lang="en" onClose={onClose} />);

    // dateStr sans time
    expect(screen.getByText('Date:2025-12-12')).toBeInTheDocument();
    // prix original barré
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    // prix final = 50 * (1-0.5) = 25
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    // badge “–50%”
    expect(screen.getByText(/50%/)).toBeInTheDocument();
    // soldOut message (deux occurrences : <Typography> et bouton)
    const soldOutTexts = screen.getAllByText('out_of_stock');
    expect(soldOutTexts.length).toBeGreaterThanOrEqual(1);

    // Bouton “buy” disabled (label also "out_of_stock")
    const buyButtons = screen.getAllByRole('button', { name: 'out_of_stock' });
    expect(buyButtons[0]).toBeDisabled();

    // Cliquer n’appelera pas handleBuy
    fireEvent.click(buyButtons[0]);
    expect(mockAddToCart).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('early return dans handleBuy quand product est null', () => {
    useProductDetails.mockReturnValue({ product: null, loading: false, error: null });
    useCartStore.mockReturnValue([]);

    render(<ProductDetailsModal open={true} productId={9} lang="en" onClose={onClose} />);

    // On voit ErrorDisplay, pas de bouton "buy"
    expect(screen.getByTestId('error-display')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'buy' })).toBeNull();
    expect(mockAddToCart).not.toHaveBeenCalled();
  });
});
