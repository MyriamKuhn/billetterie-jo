import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { Product } from '../../types/products';
import { vi } from 'vitest';

// Mock de react-i18next
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      opts && opts.count != null ? `${key}:${opts.count}` : key,
  }),
}));

describe('<ProductCard />', () => {
  const baseProduct: Product = {
    id: 1,
    name: 'TestProd',
    price: 100,
    sale: 0,
    stock_quantity: 10,
    product_details: {
      date: '2025-03-03',
      time: '12:34',
      location: 'LocX',
      places: 3,
      category: 'Cat',
      description: 'Desc',
      image: 'img.jpg',
    },
  };

  const fmtCur = (n: number) => `$${n.toFixed(2)}`;
  const fmtDate = (s?: string) => (s ? `Date:${s}` : '');

  it('renders basic info without sale and in stock', () => {
    const onViewDetails = vi.fn();
    render(
      <ProductCard
        product={baseProduct}
        fmtCur={fmtCur}
        fmtDate={fmtDate}
        onViewDetails={onViewDetails}
      />
    );

    // Nom et date
    expect(screen.getByRole('heading', { name: 'TestProd' })).toBeInTheDocument();
    expect(screen.getByText('Date:2025-03-03 – 12:34')).toBeInTheDocument();

    // Lieu, places et prix
    expect(screen.getByText('LocX')).toBeInTheDocument();
    expect(screen.getByText('ticket:tickets.places:3')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();

    // Bouton "more_info"
    const infoBtn = screen.getByRole('button', { name: 'ticket:tickets.more_info' });
    fireEvent.click(infoBtn);
    expect(onViewDetails).toHaveBeenCalledWith(1);

    // Lien "buy"
    const buyLink = screen.getByRole('link', { name: 'ticket:tickets.buy' });
    expect(buyLink).toHaveAttribute('href', '/tickets/1');
    expect(buyLink).not.toHaveAttribute('aria-disabled');
  });

  it('renders sold out and sale correctly', () => {
    const soldOutProduct = {
      ...baseProduct,
      price: 200,
      sale: 0.5,
      stock_quantity: 0,
    };
    const onViewDetails = vi.fn();

    render(
      <ProductCard
        product={soldOutProduct}
        fmtCur={fmtCur}
        fmtDate={fmtDate}
        onViewDetails={onViewDetails}
      />
    );

    // Prix barré et prix final
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('–50%')).toBeInTheDocument();

    // "out_of_stock" apparaît dans le paragraphe et dans le lien
    const occurrences = screen.getAllByText('ticket:tickets.out_of_stock');
    expect(occurrences.length).toBeGreaterThanOrEqual(2);

    // Bouton "more_info" toujours présent
    const infoBtn = screen.getByRole('button', { name: 'ticket:tickets.more_info' });
    expect(infoBtn).toBeInTheDocument();

    // Lien "buy" désactivé et label out_of_stock
    const buyLink = screen.getByRole('link', { name: 'ticket:tickets.out_of_stock' });
    expect(buyLink).toHaveAttribute('href', '/tickets/1');
    expect(buyLink).toHaveAttribute('aria-disabled', 'true');
  });
});
