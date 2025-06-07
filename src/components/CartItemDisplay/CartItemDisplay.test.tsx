import { render, screen, fireEvent, within } from '@testing-library/react';
import { CartItemDisplay } from './CartItemDisplay';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── ❶ Mocks des modules tiers ───────────────────────────────────────────────────

// 1) Mock de useTranslation pour renvoyer simplement la clé, ou "clé:valeur" si { count } ou { total } est fourni
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      opts && opts.total !== undefined
        ? `${key}:${opts.total}`
        : opts && opts.count !== undefined
        ? `${key}:${opts.count}`
        : key,
  }),
}));

// 2) Mock de formatCurrency et formatDate pour renvoyer une sortie déterministe
vi.mock('../../utils/format', () => ({
  __esModule: true,
  formatCurrency: (value: number, lang: string, currency: string) =>
    // Ex. "fr-FR-EUR-10.00"
    `${lang}-${currency}-${value.toFixed(2)}`,
  formatDate: (date: string, lang: string, opts: any) =>
    // Ex. "2023-03-15:fr-FR:day.month.year"
    `${date}:${lang}:${Object.keys(opts).join('.')}`,
}));

// 3) Mock de QuantityInput : affiche deux boutons "−" et "+" et un <span> pour la quantité
vi.mock('../QuantityInput', () => ({
  __esModule: true,
  default: ({ item, adjustQty }: any) => (
    <div data-testid={`quantity-input-${item.id}`}>
      <button
        data-testid={`dec-${item.id}`}
        onClick={() => adjustQty(item, item.quantity - 1)}
      >
        −
      </button>
      <span data-testid={`current-${item.id}`}>{item.quantity}</span>
      <button
        data-testid={`inc-${item.id}`}
        onClick={() => adjustQty(item, item.quantity + 1)}
      >
        +
      </button>
    </div>
  ),
}));

// ─── ❷ Définition du type "CartItem" des tests ───────────────────────────────────
type CartItem = {
  id: string;
  name: string;
  date: string;
  time?: string;
  location: string;
  price: number;
  originalPrice: number | null;
  discountRate: number | null;
  quantity: number;
  availableQuantity: number;
  image: string;      // ajouté pour satisfaire l’interface réelle
  inStock: boolean;   // ajouté pour satisfaire l’interface réelle
};

describe('<CartItemDisplay />', () => {
  let adjustSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    adjustSpy = vi.fn();
  });

  // Base item auquel on ajoutera image et inStock à chaque fois
  const baseItem: CartItem = {
    id: 'item123',
    name: 'Mon produit',
    date: '2023-03-15',
    time: '12:30',
    location: 'Paris',
    price: 10,
    originalPrice: null,
    discountRate: null,
    quantity: 2,
    availableQuantity: 5,
    image: '',      // stub vide
    inStock: true,  // stub true
  };

  it('mobile – sans discount, time undefined, availableQuantity>0', () => {
    const item: CartItem = {
      ...baseItem,
      time: undefined,
      originalPrice: null,
      discountRate: null,
    };

    render(
      <CartItemDisplay
        item={item}
        lang="fr-FR"
        adjustQty={adjustSpy}
        isMobile={true}
      />
    );

    // 1) Nom
    expect(screen.getByText('Mon produit')).toBeInTheDocument();

    // 2) Chip date "2023-03-15:fr-FR:day.month.year"
    expect(
      screen.getByText('2023-03-15:fr-FR:day.month.year')
    ).toBeInTheDocument();

    // 3) Pas de chip time
    expect(screen.queryByText('12:30')).toBeNull();

    // 4) Chip location
    expect(screen.getByText('Paris')).toBeInTheDocument();

    // 5) Chip remaining "cart.remaining:5"
    expect(screen.getByText('cart.remaining:5')).toBeInTheDocument();

    // 6) Prix unitaire sans discount
    expect(screen.getByText('fr-FR-EUR-10.00')).toBeInTheDocument();

    // 7) QuantityInput mock affiche "2"
    expect(screen.getByTestId(`current-${item.id}`)).toHaveTextContent('2');

    // 8) Total "table.total_price:fr-FR-EUR-20.00"
    expect(
      screen.getByText('table.total_price:fr-FR-EUR-20.00')
    ).toBeInTheDocument();
  });

  it('mobile – affiche prix barré + discountRate != null', () => {
    const item: CartItem = {
      ...baseItem,
      originalPrice: 20,
      discountRate: 0.5,
    };

    render(
      <CartItemDisplay
        item={item}
        lang="en-US"
        adjustQty={adjustSpy}
        isMobile={true}
      />
    );

    // 1) Nom
    expect(screen.getByText('Mon produit')).toBeInTheDocument();

    // 2) Prix barré = "en-US-EUR-20.00", prix réel = "en-US-EUR-10.00"
    expect(screen.getByText('en-US-EUR-20.00')).toBeInTheDocument();
    expect(screen.getByText('en-US-EUR-10.00')).toBeInTheDocument();

    // 3) Chip "-50%"
    expect(screen.getByText('-50%')).toBeInTheDocument();

    // 4) Total "table.total_price:en-US-EUR-20.00"
    expect(
      screen.getByText('table.total_price:en-US-EUR-20.00')
    ).toBeInTheDocument();
  });

  it('mobile – chip “remaining” en error quand availableQuantity=0', () => {
    const item: CartItem = {
      ...baseItem,
      availableQuantity: 0,
    };

    render(
      <CartItemDisplay
        item={item}
        lang="de-DE"
        adjustQty={adjustSpy}
        isMobile={true}
      />
    );

    // Chip "cart.remaining:0" doit apparaître
    expect(screen.getByText('cart.remaining:0')).toBeInTheDocument();
  });

  it('mobile – clique sur boutons +/− appelle adjustQty avec bonne valeur', () => {
    const item: CartItem = {
      ...baseItem,
      quantity: 3,
    };

    render(
      <CartItemDisplay
        item={item}
        lang="es-ES"
        adjustQty={adjustSpy}
        isMobile={true}
      />
    );

    const decBtn = screen.getByTestId(`dec-${item.id}`);
    const incBtn = screen.getByTestId(`inc-${item.id}`);

    fireEvent.click(decBtn);
    expect(adjustSpy).toHaveBeenCalledWith(item, 2);

    fireEvent.click(incBtn);
    expect(adjustSpy).toHaveBeenCalledWith(item, 4);
  });

  it('desktop – sans discount, isMobile=false', () => {
    const item: CartItem = {
      ...baseItem,
      time: '08:00',
      originalPrice: null,
      discountRate: null,
    };

    render(
      <table>
        <tbody>
          <CartItemDisplay
            item={item}
            lang="it-IT"
            adjustQty={adjustSpy}
            isMobile={false}
          />
        </tbody>
      </table>
    );

    // 1) Nom
    expect(screen.getByText('Mon produit')).toBeInTheDocument();

    // 2) Chip date + chip time + chip location
    expect(
      screen.getByText('2023-03-15:it-IT:day.month.year')
    ).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();

    // 3) Chip remaining
    expect(screen.getByText('cart.remaining:5')).toBeInTheDocument();

    // 4) Prix unitaire
    expect(screen.getByText('it-IT-EUR-10.00')).toBeInTheDocument();

    // 5) QuantityInput mock affiche "2"
    expect(screen.getByTestId(`current-${item.id}`)).toHaveTextContent('2');

    // 6) Total colonne = "it-IT-EUR-20.00"
    expect(screen.getByText('it-IT-EUR-20.00')).toBeInTheDocument();
  });

  it('desktop – avec discountRate != null', () => {
    const item: CartItem = {
      ...baseItem,
      time: undefined,
      originalPrice: 50,
      discountRate: 0.2,
      quantity: 1,
      availableQuantity: 10,
    };

    render(
      <table>
        <tbody>
          <CartItemDisplay
            item={item}
            lang="pt-PT"
            adjustQty={adjustSpy}
            isMobile={false}
          />
        </tbody>
      </table>
    );

    // 1) Nom
    expect(screen.getByText('Mon produit')).toBeInTheDocument();

    // 2) Pas de chip “time”
    expect(screen.queryByText('12:30')).toBeNull();

    // 3) Prix barré + prix remisé + chip "-20%"
    expect(screen.getByText('pt-PT-EUR-50.00')).toBeInTheDocument();
    // Le prix remisé "pt-PT-EUR-10.00" apparaît deux fois : unit price et total
    const discountedAndTotal = screen.getAllByText('pt-PT-EUR-10.00');
    expect(discountedAndTotal).toHaveLength(2);

    // 4) Chip "-20%"
    expect(screen.getByText('-20%')).toBeInTheDocument();
  });

  it('desktop – clique sur boutons +/− appelle adjustQty correctement', () => {
    const item: CartItem = {
      ...baseItem,
      quantity: 4,
    };

    render(
      <table>
        <tbody>
          <CartItemDisplay
            item={item}
            lang="nl-NL"
            adjustQty={adjustSpy}
            isMobile={false}
          />
        </tbody>
      </table>
    );

    const decBtn = screen.getByTestId(`dec-${item.id}`);
    const incBtn = screen.getByTestId(`inc-${item.id}`);

    fireEvent.click(decBtn);
    expect(adjustSpy).toHaveBeenCalledWith(item, 3);

    fireEvent.click(incBtn);
    expect(adjustSpy).toHaveBeenCalledWith(item, 5);
  });

  it('desktop – chip “remaining” en error quand availableQuantity=0', () => {
    const item: CartItem = {
      ...baseItem,
      time: undefined,
      originalPrice: null,
      discountRate: null,
      quantity: 1,
      availableQuantity: 0, // force la branche "error"
    };

    render(
      <table>
        <tbody>
          <CartItemDisplay
            item={item}
            lang="en-GB"
            adjustQty={adjustSpy}
            isMobile={false}
          />
        </tbody>
      </table>
    );

    // On récupère la chip "cart.remaining:0" et on vérifie qu'elle porte bien la classe MuiChip-colorError
    const chip = screen.getByText('cart.remaining:0').closest('.MuiChip-root');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('MuiChip-colorError');
  });

  it('desktop – avec discountRate != null (vérifie le style des Typography)', () => {
    const item: CartItem = {
      ...baseItem,
      time: undefined,
      originalPrice: 50,
      discountRate: 0.2,
      quantity: 1,
      availableQuantity: 10,
    };

    render(
      <table>
        <tbody>
          <CartItemDisplay
            item={item}
            lang="pt-PT"
            adjustQty={adjustSpy}
            isMobile={false}
          />
        </tbody>
      </table>
    );

    // on clique pas, on se contente de "voir" le rendu
    // on récupère tous les Typography du prix unitaire
    const priceCell = screen.getByText('pt-PT-EUR-50.00').closest('td')!;

    // 1) l'ancien prix doit être barré
    const oldPrice = within(priceCell).getByText('pt-PT-EUR-50.00');
    expect(oldPrice).toHaveStyle('text-decoration: line-through');

    // 2) le nouveau prix doit être en font-weight:bold
    const newPrice = within(priceCell).getByText('pt-PT-EUR-10.00');
    expect(newPrice).toHaveStyle('font-weight: 700');

    // 3) on conserve le test du chip "-20%"
    expect(within(priceCell).getByText('-20%')).toBeInTheDocument();

    // 4) et on vérifie le total (déjà fait par ton getAllByText)
    const totals = screen.getAllByText('pt-PT-EUR-10.00');
    expect(totals).toHaveLength(2);
  });

  it('mobile – branch discount pleinement couverte', () => {
    const item: CartItem = {
      ...baseItem,
      originalPrice: 30,
      discountRate: 0.4,
      quantity: 3,
      availableQuantity: 10,
    };

    render(
      <CartItemDisplay
        item={item}
        lang="fr-FR"
        adjustQty={adjustSpy}
        isMobile={true}
      />
    );

    // on ne s’intéresse qu’à la zone discount
    // prix barré (originalPrice)
    expect(screen.getByText('fr-FR-EUR-30.00')).toBeInTheDocument();

    // prix remisé (price)
    expect(screen.getByText('fr-FR-EUR-10.00')).toBeInTheDocument();

    // chip "-40%"
    expect(screen.getByText('-40%')).toBeInTheDocument();
  });
});
