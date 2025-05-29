import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 0️⃣ Mock react-i18next
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts && opts.count !== undefined ? `${key}:${opts.count}` : key.replace(/.*\./, ''),
  }),
}));

// 1️⃣ Mock hooks/useProductDetails
const useProductDetails = vi.fn();
vi.mock('../../hooks/useProductDetails', () => ({
  useProductDetails: (...args: any[]) => useProductDetails(...args),
}));

// 2️⃣ Mock utils/format
vi.mock('../../utils/format', () => ({
  formatCurrency: (v: number) => `$${v.toFixed(2)}`,
  formatDate: (s?: string) => s ? `Date:${s}` : '',
}));

// 3️⃣ Mock child components
vi.mock('./../OlympicLoader', () => ({ __esModule: true, default: () => <div data-testid="loader" /> }));
vi.mock('../ErrorDisplay', () => ({ __esModule: true, ErrorDisplay: () => <div data-testid="error-display" /> }));

// 4️⃣ Import component under test
import { ProductDetailsModal } from './ProductDetailsModal';

describe('<ProductDetailsModal />', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    useProductDetails.mockReset();
  });

  it('shows loader when loading', () => {
    useProductDetails.mockReturnValue({ product: null, loading: true, error: null });
    render(<ProductDetailsModal open={true} productId={1} lang="en" onClose={onClose} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows error when error', () => {
    useProductDetails.mockReturnValue({ product: null, loading: false, error: 'fail' });
    render(<ProductDetailsModal open={true} productId={2} lang="en" onClose={onClose} />);
    expect(screen.getByTestId('error-display')).toBeInTheDocument();
  });

  it('renders product details without sale and in stock', () => {
    const product = {
      id: 3,
      name: 'Prod',
      price: 100,
      sale: 0,
      stock_quantity: 5,
      product_details: { date: '2025-01-01', time: '10:00', image: 'img.jpg', location: 'Loc', category: 'Cat', description: 'Desc', places: 2 },
    } as any;
    useProductDetails.mockReturnValue({ product, loading: false, error: null });
    render(<ProductDetailsModal open={true} productId={3} lang="en" onClose={onClose} />);

    // Title
    expect(screen.getByRole('heading', { name: 'Prod' })).toBeInTheDocument();

    // Date and time
    expect(screen.getByText('Date:2025-01-01 – 10:00')).toBeInTheDocument();

    // Location
    expect(screen.getByText('Loc')).toBeInTheDocument();

    // Category label
    expect(screen.getByText('category')).toBeInTheDocument();

    // Description
    expect(screen.getByText('Desc')).toBeInTheDocument();

    // Places
    expect(screen.getByText('tickets.places:2')).toBeInTheDocument();

    // Price
    expect(screen.getByText('$100.00')).toBeInTheDocument();

    // No sale chip
    expect(screen.queryByText(/-%/)).toBeNull();

    // Availability
    expect(screen.getByText('tickets.available:5')).toBeInTheDocument();

    // Buy button enabled
    const buy = screen.getByRole('link', { name: 'buy' });
    expect(buy).toHaveAttribute('href', '/tickets/3');
    expect(buy).not.toHaveAttribute('aria-disabled');

    // Close button action
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders product with sale and sold out', () => {
    const product = {
      id: 4,
      name: 'SoldOut',
      price: 200,
      sale: 0.5,
      stock_quantity: 0,
      product_details: { date: '2025-02-02', time: '', image: 'i.jpg', location: 'Here', category: 'Cat2', description: 'D2', places: 0 },
    } as any;
    useProductDetails.mockReturnValue({ product, loading: false, error: null });
    render(<ProductDetailsModal open={true} productId={4} lang="en" onClose={onClose} />);

    // Original price struck through
    expect(screen.getByText('$200.00')).toBeInTheDocument();

    // Final price
    expect(screen.getByText('$100.00')).toBeInTheDocument();

    // Sale chip
    expect(screen.getByText(/50%/)).toBeInTheDocument();

    // Out of stock label appears
    const occurrences = screen.getAllByText('out_of_stock');
    expect(occurrences.length).toBeGreaterThan(0);

    // Disabled buy link
    const outLink = screen.getByRole('link', { name: 'out_of_stock' });
    expect(outLink).toHaveAttribute('href', '/tickets/4');
    expect(outLink).toHaveAttribute('aria-disabled', 'true');
  });

  it('n’appelle useProductDetails qu’avec null quand open=false', () => {
    // On simule un return simple pour ne pas planter le render
    useProductDetails.mockReturnValue({ product: null, loading: false, error: null });

    // On render avec open=false
    render(
      <ProductDetailsModal
        open={false}
        productId={123}
        lang="fr"
        onClose={onClose}
      />
    );

    // Le hook doit avoir été appelé AVEC null (et la langue)
    expect(useProductDetails).toHaveBeenCalledWith(null, 'fr');
  });
});
