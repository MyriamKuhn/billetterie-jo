import { render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'

// 1) Mock react-i18next
vi.mock('react-i18next', async (importActual) => {
  const actual = (await importActual()) as Record<string, any>
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, vars?: Record<string, any>) =>
        key === 'table.total_price'
          ? `Total: ${vars?.total}`
          : key,
    }),
  }
})

// 2) Mock formatCurrency and formatDate
vi.mock('../../utils/format', () => ({
  formatCurrency: (amount: number, _lang: string, _cur: string) =>
    `CUR(${amount})`,
  formatDate: (_date: string, _lang: string, _opts: any) =>
    'DATE',
}))

// 3) Mock QuantityInput as a simple button
vi.mock('../QuantityInput', () => ({
  __esModule: true,
  default: ({ item, adjustQty }: any) => (
    <button
      data-testid="qty-btn"
      onClick={() => adjustQty(item, item.quantity + 1)}
    >
      Qty {item.quantity}
    </button>
  ),
}))

import { CartItemDisplay } from './CartItemDisplay'
import type { CartItem } from '../../stores/useCartStore'

describe('CartItemDisplay', () => {
  const baseItem: CartItem = {
    id: '1',
    name: 'Test Event',
    image: '',
    date: '2025-07-01',
    time: '14:00',
    location: 'Testville',
    quantity: 2,
    price: 80,
    totalPrice: 160,
    inStock: true,
    availableQuantity: 5,
    discountRate: 0.2,
    originalPrice: 100,
  }

  const adjustQty = vi.fn()

  it('renders discount block in mobile view', () => {
    render(
      <CartItemDisplay
        item={baseItem}
        lang="en"
        adjustQty={adjustQty}
        isMobile={true}
      />
    )

    // Original price struck-through
    const orig = screen.getByText('CUR(100)')
    expect(orig).toHaveStyle('text-decoration: line-through')

    // Discounted price bold
    const discounted = screen.getByText('CUR(80)')
    expect(discounted).toHaveStyle('font-weight: 700')

    // Discount percentage chip
    expect(screen.getByText('-20%')).toBeInTheDocument()
  })

  it('renders discount block in desktop view', () => {
    render(
      <table>
        <tbody>
          <CartItemDisplay
            item={baseItem}
            lang="en"
            adjustQty={adjustQty}
            isMobile={false}
          />
        </tbody>
      </table>
    )

    // getAllByRole('cell') returns [product cell, unit price cell, qty cell, total cell]
    const cells = screen.getAllByRole('cell')
    const unitCell = cells[1]  // second cell is unit price

    // Original price struck-through
    expect(within(unitCell).getByText('CUR(100)')).toHaveStyle(
      'text-decoration: line-through'
    )
    // Discounted price bold
    expect(within(unitCell).getByText('CUR(80)')).toHaveStyle(
      'font-weight: 700'
    )
    // Discount chip
    expect(within(unitCell).getByText('-20%')).toBeInTheDocument()
  })

  // ── Cas fallback originalPrice null (pour coverage originalPrice ?? 0) ───────────────
  it('mobile: affiche CUR(0) quand originalPrice est null', () => {
    const item2: CartItem = {
      ...baseItem,
      originalPrice: null,
      discountRate: 0.3,    // pour toujours entrer dans le bloc discount
      price: 50,
      quantity: 1,
    };

    render(
      <CartItemDisplay
        item={item2}
        lang="en"
        adjustQty={adjustQty}
        isMobile={true}
      />
    );

    // originalPrice fallback -> 0
    const orig0 = screen.getByText('CUR(0)');
    expect(orig0).toHaveStyle('text-decoration: line-through');

    // prix réduit correct
    const disc50 = screen.getByText('CUR(50)');
    expect(disc50).toHaveStyle('font-weight: 700');

    // puce -30%
    expect(screen.getByText('-30%')).toBeInTheDocument();
  });

  it('desktop: affiche CUR(0) quand originalPrice est null', () => {
    const item2: CartItem = {
      ...baseItem,
      originalPrice: null,
      discountRate: 0.3,
      price: 50,
      quantity: 1,
    };

    render(
      <table>
        <tbody>
          <CartItemDisplay
            item={item2}
            lang="en"
            adjustQty={adjustQty}
            isMobile={false}
          />
        </tbody>
      </table>
    );

    const unitCell = screen.getAllByRole('cell')[1];
    // originalPrice fallback -> 0
    const orig0 = within(unitCell).getByText('CUR(0)');
    expect(orig0).toHaveStyle('text-decoration: line-through');

    // prix réduit correct
    const disc50 = within(unitCell).getByText('CUR(50)');
    expect(disc50).toHaveStyle('font-weight: 700');

    // puce -30%
    expect(within(unitCell).getByText('-30%')).toBeInTheDocument();
  });

  // ── Cas tiny discountRate pour forcer le *100 → 1% ─────────────
  it('mobile: affiche "-1%" quand discountRate=0.01 (0.01*100→1)', () => {
    const item3: CartItem = {
      ...baseItem,
      discountRate: 0.01,
      originalPrice: 200,
      price: 198,
      quantity: 1,
    };

    render(
      <CartItemDisplay
        item={item3}
        lang="en"
        adjustQty={adjustQty}
        isMobile={true}
      />
    );

    // on doit voir le label "-1%"
    expect(screen.getByText('-1%')).toBeInTheDocument();
  });

  it('desktop: affiche "-1%" pour discountRate=0.01', () => {
    const item3: CartItem = {
      ...baseItem,
      discountRate: 0.01,
      originalPrice: 200,
      price: 198,
      quantity: 1,
    };

    render(
      <table>
        <tbody>
          <CartItemDisplay
            item={item3}
            lang="en"
            adjustQty={adjustQty}
            isMobile={false}
          />
        </tbody>
      </table>
    );

    const unitCell = screen.getAllByRole('cell')[1];
    expect(within(unitCell).getByText('-1%')).toBeInTheDocument();
  });

  it('mobile: affiche "-1%" quand discountRate=0.01 (0.01*100→1)', () => {
    const item: CartItem = { 
      ...baseItem, 
      discountRate: 0.01, 
      originalPrice: null, 
      price: 198, 
      quantity: 1,
    }
    render(<CartItemDisplay item={item} lang="en" adjustQty={()=>{}} isMobile/>)
    expect(screen.getByText('CUR(0)')).toHaveStyle('text-decoration: line-through')
    expect(screen.getByText('-1%')).toBeInTheDocument()
  })

  it('desktop: affiche "-1%" pour discountRate=0.01', () => {
    const item: CartItem = { 
      ...baseItem, 
      discountRate: 0.01, 
      originalPrice: null, 
      price: 198, 
      quantity: 1,
    }
    render(
      <table><tbody>
        <CartItemDisplay item={item} lang="en" adjustQty={()=>{}} isMobile={false}/>
      </tbody></table>
    )
    const unitCell = screen.getAllByRole('cell')[1]
    expect(within(unitCell).getByText('-1%')).toBeInTheDocument()
  })
})
