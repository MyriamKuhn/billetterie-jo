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

// Mock de la config pour API_BASE_URL
vi.mock('../../config', () => ({
  API_BASE_URL: 'http://test-api',
}));

// Import du placeholder pour vérification
import placeholderImg from '../../assets/products/placeholder.png';

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
        onBuy={() => {}}
      />
    );

    // Vérifie le nom et la date (avec heure)
    expect(screen.getByRole('heading', { name: 'TestProd' })).toBeInTheDocument();
    expect(screen.getByText('Date:2025-03-03 – 12:34')).toBeInTheDocument();

    // Lieu, places et prix
    expect(screen.getByText('LocX')).toBeInTheDocument();
    expect(screen.getByText('ticket:tickets.places:3')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();

    // Vérifie l'image construite via API_BASE_URL + nom de fichier
    const img = screen.getByRole('img', { name: 'TestProd' }) as HTMLImageElement;
    expect(img.src).toContain('http://test-api/products/images/img.jpg');

    // Bouton "more_info" déclenche bien onViewDetails avec l'id
    const infoBtn = screen.getByRole('button', { name: 'ticket:tickets.more_info' });
    fireEvent.click(infoBtn);
    expect(onViewDetails).toHaveBeenCalledWith(1);

    // Bouton "buy" est activé
    const buyButton = screen.getByRole('button', { name: 'ticket:tickets.buy' });
    expect(buyButton).toBeEnabled();
  });

  it('renders sold out and sale correctly', () => {
    const soldOutProduct: Product = {
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
        onBuy={() => {}}
      />
    );

    // Prix barré et prix final
    // Le prix barré : 200, prix final après 50% de remise : 100
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('–50%')).toBeInTheDocument();

    // "out_of_stock" doit apparaître au moins deux fois : dans le texte de disponibilité et dans le label du bouton
    const occurrences = screen.getAllByText('ticket:tickets.out_of_stock');
    expect(occurrences.length).toBeGreaterThanOrEqual(2);

    // Vérifie l'image (toujours baseProduct.image = 'img.jpg')
    const img = screen.getByRole('img', { name: 'TestProd' }) as HTMLImageElement;
    expect(img.src).toContain('http://test-api/products/images/img.jpg');

    // Bouton "more_info" toujours présent
    const infoBtn = screen.getByRole('button', { name: 'ticket:tickets.more_info' });
    expect(infoBtn).toBeInTheDocument();

    // Bouton "buy" désactivé et portant le texte out_of_stock
    const buyButton = screen.getByRole('button', { name: 'ticket:tickets.out_of_stock' });
    expect(buyButton).toBeDisabled();
  });

  it('renders placeholder image when product_details.image is empty or undefined', () => {
    const noImageProduct1: Product = {
      ...baseProduct,
      product_details: {
        ...baseProduct.product_details,
        image: '', // chaîne vide
      },
    };
    const noImageProduct2: Product = {
      ...baseProduct,
      product_details: {
        ...baseProduct.product_details,
        // @ts-expect-error: pour simuler undefined
        image: undefined,
      },
    };

    const onViewDetails = vi.fn();
    const commonProps = {
      fmtCur,
      fmtDate,
      onViewDetails,
      onBuy: () => {},
    };

    // Premier rendu avec image vide
    const { rerender } = render(
      <ProductCard
        product={noImageProduct1}
        {...commonProps}
      />
    );
    let img = screen.getByRole('img', { name: 'TestProd' }) as HTMLImageElement;
    // Vérifie que le src contient bien la partie placeholder
    expect(img.src).toContain(placeholderImg);

    // Remplace le rendu avec image undefined
    rerender(
      <ProductCard
        product={noImageProduct2}
        {...commonProps}
      />
    );
    img = screen.getByRole('img', { name: 'TestProd' }) as HTMLImageElement;
    expect(img.src).toContain(placeholderImg);
  });
});

