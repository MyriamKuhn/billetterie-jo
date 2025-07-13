import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AdminProductGrid } from './AdminProductGrid'

// 1) mock useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

// 2) mock CreateProductCard
const onCreateMockLabel = 'Create'
vi.mock('../CreateProductCard', () => ({
  CreateProductCard: (props: any) => (
    <button onClick={props.onCreate}>{onCreateMockLabel}</button>
  )
}))

// 3) mock AdminProductCard
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
    vi.clearAllMocks()
  })

  it('affiche un message quand la liste est vide', () => {
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
    expect(screen.getByText('errors.not_found')).toBeInTheDocument()
  })

  it('rend CreateProductCard et un bouton pour chaque produit', () => {
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

    // le CreateProductCard mocké
    expect(screen.getByText(onCreateMockLabel)).toBeInTheDocument()
    // un bouton par produit
    expect(screen.getByText('View-1')).toBeInTheDocument()
    expect(screen.getByText('View-2')).toBeInTheDocument()
  })

  it('déclenche onCreate quand on clique sur CreateProductCard', async () => {
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
    await userEvent.click(screen.getByText(onCreateMockLabel))
    expect(onCreate).toHaveBeenCalledOnce()
  })

  it('déclenche onViewDetails avec le bon id', async () => {
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
    await userEvent.click(screen.getByText('View-42'))
    expect(onViewDetails).toHaveBeenCalledWith(42)
  })
})
