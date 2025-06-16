// src/components/ProductDetailsModal/ProductDetailsModal.test.tsx

import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 0️⃣ Mock de la config pour API_BASE_URL AVANT d’importer le composant
vi.mock('../../config', () => ({
  API_BASE_URL: 'http://test-api',
}));

// 1️⃣ Mock react-i18next (incluant initReactI18next) AVANT d’importer le composant
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

// 2️⃣ Mock useProductDetails
const useProductDetails = vi.fn();
vi.mock('../../hooks/useProductDetails', () => ({
  useProductDetails: (...args: any[]) => useProductDetails(...args),
}));

// 3️⃣ Mock utils/format
vi.mock('../../utils/format', () => ({
  formatCurrency: (v: number, /*lang*/ _lang?: string, /*currency*/ _cur?: string) => `$${v.toFixed(2)}`,
  formatDate: (s?: string, /*lang*/ _lang?: string) => (s ? `Date:${s}` : ''),
}));

// 4️⃣ Mock children composants
vi.mock('./../OlympicLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));
vi.mock('../ErrorDisplay', () => ({
  __esModule: true,
  ErrorDisplay: () => <div data-testid="error-display" />,
}));

// 5️⃣ Mock useCartStore
const useCartStore = vi.fn();
vi.mock('../../stores/useCartStore', () => ({
  __esModule: true,
  useCartStore: (selector: any) => selector({ items: useCartStore() }),
}));

// 6️⃣ Mock useAddToCart
const mockAddToCart = vi.fn();
vi.mock('../../hooks/useAddToCart', () => ({
  __esModule: true,
  useAddToCart: () => mockAddToCart,
}));

// 7️⃣ Import du placeholder pour vérification du fallback
import placeholderImg from '../../assets/products/placeholder.png';

// 8️⃣ Import du composant sous test APRÈS les mocks
import { ProductDetailsModal } from './ProductDetailsModal';

describe('<ProductDetailsModal /> – couverture 100 %, y compris image src', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    useProductDetails.mockReset();
    useCartStore.mockReset();
    mockAddToCart.mockReset();
    cleanup();
  });

  it('n’appelle useProductDetails qu’avec null quand open=false', () => {
    useProductDetails.mockReturnValue({ product: null, loading: false, error: null });
    render(<ProductDetailsModal open={false} productId={123} lang="fr" onClose={onClose} />);
    expect(useProductDetails).toHaveBeenCalledWith(null, 'fr');
  });

  it('appelle useProductDetails avec productId et lang quand open=true', () => {
    useProductDetails.mockReturnValue({ product: null, loading: false, error: null });
    render(<ProductDetailsModal open={true} productId={42} lang="de" onClose={onClose} />);
    expect(useProductDetails).toHaveBeenCalledWith(42, 'de');
  });

  it('affiche loader quand loading=true', () => {
    useProductDetails.mockReturnValue({ product: null, loading: true, error: null });
    render(<ProductDetailsModal open={true} productId={1} lang="en" onClose={onClose} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('affiche error quand error non-null', () => {
    useProductDetails.mockReturnValue({ product: null, loading: false, error: 'fail' });
    render(<ProductDetailsModal open={true} productId={2} lang="en" onClose={onClose} />);
    expect(screen.getByTestId('error-display')).toBeInTheDocument();
  });

  it('affiche error quand product=null et error=null', () => {
    useProductDetails.mockReturnValue({ product: null, loading: false, error: null });
    render(<ProductDetailsModal open={true} productId={3} lang="en" onClose={onClose} />);
    expect(screen.getByTestId('error-display')).toBeInTheDocument();
  });

  it('calcule dateStr + time + finalPrice et exécute handleBuy (ok=true)', async () => {
    const product = {
      id: 10,
      name: 'NoPromo',
      price: 80,
      sale: 0,
      stock_quantity: 3,
      product_details: {
        date: '2025-07-07',
        time: '09:30',
        image: 'img10.jpg',
        location: 'Place10',
        category: 'Cat10',
        description: 'Desc10',
        places: 5,
      },
    } as any;

    useProductDetails.mockReturnValue({ product, loading: false, error: null });
    useCartStore.mockReturnValue([]); 
    mockAddToCart.mockResolvedValue(true);

    render(<ProductDetailsModal open={true} productId={10} lang="en" onClose={onClose} />);

    // dateStr = formatDate(...) + " – time"
    expect(screen.getByText('Date:2025-07-07 – 09:30')).toBeInTheDocument();
    // finalPrice sans promo
    expect(screen.getByText('$80.00')).toBeInTheDocument();
    // pas de chip pour sale=0
    expect(screen.queryByText(/-%/)).toBeNull();
    // available
    expect(screen.getByText('ticket:tickets.available:3')).toBeInTheDocument();

    // Bouton buy
    const buyButton = screen.getByRole('button', { name: 'buy' });
    await act(async () => fireEvent.click(buyButton));
    expect(mockAddToCart).toHaveBeenCalledWith('10', 1, 3);
    expect(onClose).toHaveBeenCalled();
  });

  it('incrémente qty quand article existe déjà et teste handleBuy ok→onClose', async () => {
    const product = {
      id: 50,
      name: 'Existing',
      price: 30,
      sale: 0,
      stock_quantity: 5,
      product_details: {
        date: '2025-11-11',
        time: '12:12',
        image: 'img50.jpg',
        location: 'Loc50',
        category: 'Cat50',
        description: 'Desc50',
        places: 5,
      },
    } as any;

    useProductDetails.mockReturnValue({ product, loading: false, error: null });
    useCartStore.mockReturnValue([{ id: '50', quantity: 2 }]);
    mockAddToCart.mockResolvedValue(true);

    render(<ProductDetailsModal open={true} productId={50} lang="en" onClose={onClose} />);

    expect(screen.getByText('Date:2025-11-11 – 12:12')).toBeInTheDocument();
    expect(screen.getByText('$30.00')).toBeInTheDocument();
    expect(screen.getByText('ticket:tickets.available:5')).toBeInTheDocument();

    const buyButton = screen.getByRole('button', { name: 'buy' });
    await act(async () => fireEvent.click(buyButton));
    expect(mockAddToCart).toHaveBeenCalledWith('50', 3, 5);
    expect(onClose).toHaveBeenCalled();
  });

  it('n’appelle pas onClose si addToCart retourne false pour produit en stock', async () => {
    const product = {
      id: 40,
      name: 'NoClose',
      price: 50,
      sale: 0,
      stock_quantity: 2,
      product_details: {
        date: '2025-10-10',
        time: '11:11',
        image: 'img40.jpg',
        location: 'Loc40',
        category: 'Cat40',
        description: 'Desc40',
        places: 2,
      },
    } as any;

    useProductDetails.mockReturnValue({ product, loading: false, error: null });
    useCartStore.mockReturnValue([]); 
    mockAddToCart.mockResolvedValue(false);

    render(<ProductDetailsModal open={true} productId={40} lang="en" onClose={onClose} />);

    expect(screen.getByText('Date:2025-10-10 – 11:11')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('ticket:tickets.available:2')).toBeInTheDocument();

    const buyButton = screen.getByRole('button', { name: 'buy' });
    await act(async () => fireEvent.click(buyButton));
    expect(mockAddToCart).toHaveBeenCalledWith('40', 1, 2);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calcule dateStr sans time + promo + sold out + finalPrice barré', () => {
    const product = {
      id: 20,
      name: 'SoldHalf',
      price: 200,
      sale: 0.5,
      stock_quantity: 0,
      product_details: {
        date: '2025-08-08',
        time: '',
        image: 'img20.jpg',
        location: 'Here20',
        category: 'Cat20',
        description: 'Desc20',
        places: 0,
      },
    } as any;

    useProductDetails.mockReturnValue({ product, loading: false, error: null });
    useCartStore.mockReturnValue([]);
    mockAddToCart.mockResolvedValue(false);

    render(<ProductDetailsModal open={true} productId={20} lang="en" onClose={onClose} />);

    // dateStr sans time
    expect(screen.getByText('Date:2025-08-08')).toBeInTheDocument();
    // prix original + prix final
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    // badge "-50%"
    expect(screen.getByText(/50%/)).toBeInTheDocument();
    // soldOut=true et "out_of_stock"
    const soldOutTexts = screen.getAllByText('out_of_stock');
    expect(soldOutTexts.length).toBeGreaterThanOrEqual(1);
    // bouton désactivé
    const btn = screen.getAllByRole('button', { name: 'out_of_stock' })[0];
    expect(btn).toBeDisabled();
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

  // ────────────────────────────────────────────────────────────────────────────────
  // Tests ajoutés pour la couverture de la ligne src={product.product_details.image ? ... : placeholderImg}
  // ────────────────────────────────────────────────────────────────────────────────

  it('affiche l’image avec API_BASE_URL quand product_details.image est défini', () => {
    const product = {
      id: 100,
      name: 'WithImage',
      price: 60,
      sale: 0,
      stock_quantity: 1,
      product_details: {
        date: '2025-06-30',
        time: '10:00',
        image: 'img100.jpg',
        location: 'Loc100',
        category: 'Cat100',
        description: 'Desc100',
        places: 2,
      },
    } as any;

    useProductDetails.mockReturnValue({ product, loading: false, error: null });
    useCartStore.mockReturnValue([]);

    render(<ProductDetailsModal open={true} productId={100} lang="en" onClose={onClose} />);

    const img = screen.getByRole('img', { name: 'WithImage' }) as HTMLImageElement;
    expect(img.src).toContain('http://test-api/products/images/img100.jpg');
  });

  it('affiche le placeholder quand product_details.image est vide ou undefined', () => {
    // On définit deux cas de produit
    const base = {
      id: 101,
      name: 'NoImage',
      price: 70,
      sale: 0,
      stock_quantity: 1,
      product_details: {
        date: '2025-07-01',
        time: '11:00',
        // image sera surchargé
        location: 'Loc101',
        category: 'Cat101',
        description: 'Desc101',
        places: 2,
      },
    } as any;

    // Cas chaîne vide
    const productEmptyImage = {
      ...base,
      product_details: {
        ...base.product_details,
        image: '',
      },
    };
    // Cas undefined
    const productUndefinedImage = {
      ...base,
      product_details: {
        ...base.product_details,
        image: undefined,
      },
    };

    useCartStore.mockReturnValue([]);

    // 1️⃣ Mock avant le premier render pour chaîne vide
    useProductDetails.mockReturnValue({ product: productEmptyImage, loading: false, error: null });
    const { rerender } = render(
      <ProductDetailsModal open={true} productId={101} lang="en" onClose={onClose} />
    );
    let img = screen.getByRole('img', { name: 'NoImage' }) as HTMLImageElement;
    expect(img.src).toContain(placeholderImg);

    // 2️⃣ Mock avant le rerender pour undefined
    useProductDetails.mockReturnValue({ product: productUndefinedImage, loading: false, error: null });
    rerender(<ProductDetailsModal open={true} productId={101} lang="en" onClose={onClose} />);
    img = screen.getByRole('img', { name: 'NoImage' }) as HTMLImageElement;
    expect(img.src).toContain(placeholderImg);
  });
});
