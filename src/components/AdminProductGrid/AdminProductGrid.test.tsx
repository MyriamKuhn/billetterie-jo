import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AdminProductGrid } from './AdminProductGrid'

// 1) Mock useTranslation: passthrough key
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

// 2) Mock CreateProductCard: renders a button that calls onCreate
const onCreateMockLabel = 'Create'
vi.mock('../CreateProductCard', () => ({
  CreateProductCard: (props: any) => (
    <button onClick={props.onCreate}>{onCreateMockLabel}</button>
  )
}))

// 3) Mock AdminProductCard: renders a button that calls onViewDetails with product.id
vi.mock('../AdminProductCard', () => ({
  AdminProductCard: (props: any) => (
    <button onClick={() => props.onViewDetails(props.product.id)}>
      View-{props.product.id}
    </button>
  )
}))

describe('<AdminProductGrid />', () => {
  const onViewDetails = vi.fn()
  const onSave        = vi.fn()
  const onRefresh     = vi.fn()
  const onDuplicate   = vi.fn()
  const onCreate      = vi.fn()
  const lang          = 'en'

  beforeEach(() => {
    // Reset all mock calls before each test
    vi.clearAllMocks()
  })

  it('shows a not-found message when the product list is empty', () => {
    render(
      <AdminProductGrid
        products={[]}
        lang={lang}
        onViewDetails={onViewDetails}
        onSave={onSave}
        onRefresh={onRefresh}
        onDuplicate={onDuplicate}
        onCreate={onCreate}
      />
    )
    // Expect translation key for not found to appear
    expect(screen.getByText('errors.not_found')).toBeInTheDocument()
  })

  it('renders the CreateProductCard and one button per product', () => {
    const products = [
      { id: 1, name: 'A', price: 0, sale: 0, stock_quantity: 0, product_details: { date: '2025-01-01', time: '', location: '', places: 0, description:'', image:'', category:'' } },
      { id: 2, name: 'B', price: 0, sale: 0, stock_quantity: 0, product_details: { date: '2025-02-02', time: '', location: '', places: 0, description:'', image:'', category:'' } },
    ]
    render(
      <AdminProductGrid
        products={products}
        lang={lang}
        onViewDetails={onViewDetails}
        onSave={onSave}
        onRefresh={onRefresh}
        onDuplicate={onDuplicate}
        onCreate={onCreate}
      />
    )

    // The mocked CreateProductCard should render a button with our label
    expect(screen.getByText(onCreateMockLabel)).toBeInTheDocument()
    // Each product should be rendered via the mocked AdminProductCard
    expect(screen.getByText('View-1')).toBeInTheDocument()
    expect(screen.getByText('View-2')).toBeInTheDocument()
  })

  it('calls onCreate when the CreateProductCard button is clicked', async () => {
    const products = [{ id: 1, name: '', price: 0, sale: 0, stock_quantity: 0, product_details: { date:'', time:'', location:'', places:0, description:'', image:'', category:'' } }]
    render(
      <AdminProductGrid
        products={products}
        lang={lang}
        onViewDetails={onViewDetails}
        onSave={onSave}
        onRefresh={onRefresh}
        onDuplicate={onDuplicate}
        onCreate={onCreate}
      />
    )
    // Click the Create button and expect onCreate callback
    await userEvent.click(screen.getByText(onCreateMockLabel))
    expect(onCreate).toHaveBeenCalledOnce()
  })

  it('calls onViewDetails with the correct id when a product button is clicked', async () => {
    const products = [{ id: 42, name: '', price: 0, sale: 0, stock_quantity: 0, product_details: { date:'', time:'', location:'', places:0, description:'', image:'', category:'' } }]
    render(
      <AdminProductGrid
        products={products}
        lang={lang}
        onViewDetails={onViewDetails}
        onSave={onSave}
        onRefresh={onRefresh}
        onDuplicate={onDuplicate}
        onCreate={onCreate}
      />
    )
    // Click the product's View button and expect onViewDetails called with id 42
    await userEvent.click(screen.getByText('View-42'))
    expect(onViewDetails).toHaveBeenCalledWith(42)
  })
})
