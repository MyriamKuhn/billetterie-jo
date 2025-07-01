import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { AdminProductCard } from './AdminProductCard';
import type { Product } from '../../types/products';
import userEvent from '@testing-library/user-event';
import { formatCurrency } from '../../utils/format'

// Mock i18n translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: any) => {
    // simple passthrough or basic mapping
    if (opts && opts.count !== undefined) {
      return key.includes('places')
        ? `${opts.count} ${opts.count === 1 ? 'place' : 'places'}`
        : key;
    }
    return key;
  }}),
}));

// Mock custom snackbar
const notifyMock = vi.fn();
vi.mock('../../hooks/useCustomSnackbar', () => ({
  useCustomSnackbar: () => ({ notify: notifyMock }),
}));

// Mock utility functions
vi.mock('../../utils/format', () => ({
  formatCurrency: (value: number) => `${value.toFixed(2)} €`,
  formatDate: (date: string) => date,
}));

const defaultProduct: Product = {
  id: 1,
  name: 'Test Event',
  price: 100,
  sale: 0.2,
  stock_quantity: 50,
  product_details: {
    date: '2024-07-26',
    time: '18:00',
    location: 'Paris Arena',
    places: 2,
    description: 'A great event',
    image: 'image.jpg',
    category: 'concert',
  },
};

describe('AdminProductCard', () => {
  const onViewDetails = vi.fn();
  const onSave = vi.fn();
  const onRefresh = vi.fn();
  const onDuplicate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product information correctly', () => {
    render(
      <AdminProductCard
        product={defaultProduct}
        lang="en"
        onViewDetails={onViewDetails}
        onSave={onSave}
        onRefresh={onRefresh}
        onDuplicate={onDuplicate}
      />
    );

    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText(/2024-07-26/)).toBeInTheDocument()
    expect(screen.getByText(/18:00/)).toBeInTheDocument()
    expect(
      screen.getByText('Paris Arena - 2 places')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeTruthy();
    expect(screen.getByDisplayValue('20')).toBeTruthy();
    expect(screen.getByDisplayValue('50')).toBeTruthy();
  });

  it('calls onViewDetails when "Update details" clicked', () => {
    render(<AdminProductCard product={defaultProduct} lang="en" onViewDetails={onViewDetails} onSave={onSave} onRefresh={onRefresh} onDuplicate={onDuplicate} />);
    fireEvent.click(screen.getByText('products.updateDetails'));
    expect(onViewDetails).toHaveBeenCalledWith(1);
  });

  it('calls onDuplicate when "Duplicate ticket" clicked', () => {
    render(<AdminProductCard product={defaultProduct} lang="en" onViewDetails={onViewDetails} onSave={onSave} onRefresh={onRefresh} onDuplicate={onDuplicate} />);
    fireEvent.click(screen.getByText('products.duplicate'));
    expect(onDuplicate).toHaveBeenCalledWith(1);
  });

  it('updates fields and calls onSave', async () => {
    onSave.mockResolvedValue(true);
    render(<AdminProductCard product={defaultProduct} lang="en" onViewDetails={onViewDetails} onSave={onSave} onRefresh={onRefresh} onDuplicate={onDuplicate} />);

    // change price
    fireEvent.change(screen.getByLabelText('products.price'), { target: { value: '120' } });
    // change sale percent
    fireEvent.change(screen.getByLabelText('products.sale'), { target: { value: '30' } });
    // change stock
    fireEvent.change(screen.getByLabelText('products.stock'), { target: { value: '60' } });

    fireEvent.click(screen.getByText('products.save'));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(1, {
      price: 120,
      sale: 0.3,
      stock_quantity: 60,
    }));
    expect(notifyMock).toHaveBeenCalledWith('products.success', 'success');
    expect(onRefresh).toHaveBeenCalled();
  });

  it('shows error notification when save fails', async () => {
    onSave.mockResolvedValue(false);
    render(<AdminProductCard product={defaultProduct} lang="en" onViewDetails={onViewDetails} onSave={onSave} onRefresh={onRefresh} onDuplicate={onDuplicate} />);
    fireEvent.click(screen.getByText('products.save'));
    await waitFor(() => expect(notifyMock).toHaveBeenCalledWith('errors.save_failed', 'error'));
  });
});

describe('AdminProductCard – sale & stock interactions', () => {
  const baseProduct = {
    id: 1,
    name: 'Test Event',
    price: 200,
    sale: 0,              
    stock_quantity: 3,
    product_details: {
      date: '2024-07-26',
      time: '18:00',
      location: 'Paris Arena',
      places: 2,
      description: 'Mock description',
      image: 'img.png',
      category: 'Mock category',
    }
  }

  const setup = (overrides = {}) => {
    const onSave = vi.fn().mockResolvedValue(true)
    const props = {
      product: { ...baseProduct, ...overrides },
      lang: 'en',
      onViewDetails: vi.fn(),
      onSave,
      onRefresh: vi.fn(),
      onDuplicate: vi.fn(),
    }
    render(<AdminProductCard {...props} />)
    return props
  }

  test('changing sale input updates salePercent, sale state and UI', async () => {
    setup()

    const saleInput = screen.getByRole('spinbutton', { name: /sale/i })
    await userEvent.clear(saleInput)
    await userEvent.type(saleInput, '50')

    expect(saleInput).toHaveValue(50)
    expect(screen.getByText('–50%')).toBeInTheDocument()
    expect(screen.getByText(formatCurrency(100, 'en', 'EUR'))).toBeInTheDocument()
  })

  test('non-numeric sale input falls back to 0 and no chip is shown', () => {
    setup()

    const saleInput = screen.getByRole('spinbutton', { name: /sale/i })
    fireEvent.change(saleInput, { target: { value: '' } })

    expect(saleInput).toHaveValue(0)
    expect(screen.queryByText(/–0%/)).toBeNull()

    const origPrices = screen.getAllByText(formatCurrency(200, 'en', 'EUR'))
    expect(origPrices).toHaveLength(2)
    origPrices.forEach(priceEl => {
      expect(priceEl).toHaveStyle('text-decoration: none')
    })
  })

  test('changing stock input updates stock state', async () => {
    setup()

    const stockInput = screen.getByRole('spinbutton', { name: /stock/i })
    await userEvent.clear(stockInput)
    await userEvent.type(stockInput, '7')

    expect(stockInput).toHaveValue(7)
  })

  test('non-numeric sale input falls back to 0 and no chip is shown', () => {
    setup()

    const saleInput = screen.getByRole('spinbutton', { name: /sale/i })
    fireEvent.change(saleInput, { target: { value: '' } })

    expect(saleInput).toHaveValue(0)
    expect(screen.queryByText(/–0%/)).toBeNull()

    // Récupère *toutes* les occurrences de 200.00 €
    const origPrices = screen.getAllByText(formatCurrency(200, 'en', 'EUR'))
    expect(origPrices).toHaveLength(2)

    // Vérifie que tous les éléments ne sont pas barrés
    origPrices.forEach(priceEl => {
      expect(priceEl).toHaveStyle('text-decoration: none')
    })
  })

  test('changing stock input updates stock state', async () => {
    setup()

    const stockInput = screen.getByRole('spinbutton', { name: /stock/i })
    await userEvent.clear(stockInput)
    await userEvent.type(stockInput, '7')

    expect(stockInput).toHaveValue(7)
  })
})
