import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// 0️⃣ Mock react-i18next
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key }),
}));
// 1️⃣ Mock ProductCard
import type { Product } from '../../types/products';
vi.mock('../ProductCard', () => ({
  __esModule: true,
  ProductCard: ({ product, onViewDetails }: { product: Product; onViewDetails: (id: number) => void }) => (
    <div data-testid={`card-${product.id}`} onClick={() => onViewDetails(product.id)}>
      CARD {product.id}
    </div>
  ),
}));

import { ProductGrid } from './ProductGrid';

const sampleProducts: Product[] = [
  { id: 1, name: 'A', price: 10, sale: 0, stock_quantity: 5, product_details: { places: 0, description: '', image: '', date: '', time: '', location: '', category: '' } },
  { id: 2, name: 'B', price: 20, sale: 0, stock_quantity: 5, product_details: { places: 0, description: '', image: '', date: '', time: '', location: '', category: '' } },
];

describe('<ProductGrid />', () => {
  const fmtCur = (n: number) => `$${n}`;
  const fmtDate = (s?: string) => s ? `D:${s}` : '';
  const onViewDetails = vi.fn();

  it('renders not found message when products is empty', () => {
    render(<ProductGrid products={[]} fmtCur={fmtCur} fmtDate={fmtDate} onViewDetails={onViewDetails} />);
    const msg = screen.getByText('tickets.not_found');
    expect(msg).toBeInTheDocument();
    expect(msg.tagName).toBe('H4');
  });

  it('renders a ProductCard for each product and handles clicks', () => {
    render(<ProductGrid products={sampleProducts} fmtCur={fmtCur} fmtDate={fmtDate} onViewDetails={onViewDetails} />);
    // Should render two cards
    expect(screen.getByTestId('card-1')).toBeInTheDocument();
    expect(screen.getByTestId('card-2')).toBeInTheDocument();

    // Click each card
    fireEvent.click(screen.getByTestId('card-1'));
    fireEvent.click(screen.getByTestId('card-2'));
    expect(onViewDetails).toHaveBeenCalledWith(1);
    expect(onViewDetails).toHaveBeenCalledWith(2);
    expect(onViewDetails).toHaveBeenCalledTimes(2);
  });
});
