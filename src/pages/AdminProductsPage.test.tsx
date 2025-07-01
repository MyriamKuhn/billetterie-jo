import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminProductsPage from './AdminProductsPage'
import { beforeEach, describe, it, vi, expect, type Mock } from 'vitest'

// ─── MOCK PARTIEL DE react-i18next ─────────────────────────────────────────────
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>()
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  }
})

// ─── MOCK DES STORE HOOKS AVANT IMPORT ──────────────────────────────────────────
vi.mock('../stores/useLanguageStore', () => ({
  useLanguageStore: vi.fn(),
}))
vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}))

// ─── MOCK DU HOOK useAdminProducts & useUpdateProductPricing ─────────────────
vi.mock('../hooks/useAdminProducts', () => ({
  useAdminProducts: vi.fn(),
}))
vi.mock('../hooks/useUpdateProductPricing', () => ({
  useUpdateProductPricing: vi.fn(),
}))

// ─── IMPORT DES HOOKS POUR LES CASTERS EN vi.Mock ──────────────────────────────
import { useLanguageStore } from '../stores/useLanguageStore'
import { useAuthStore } from '../stores/useAuthStore'
import { useAdminProducts } from '../hooks/useAdminProducts'
import { useUpdateProductPricing } from '../hooks/useUpdateProductPricing'

const mockLangStore = useLanguageStore as unknown as Mock
const mockAuthStore = useAuthStore as unknown as Mock
const mockAdminProducts = useAdminProducts as unknown as Mock
const mockUpdatePricing = useUpdateProductPricing as unknown as Mock

// ─── MOCK DES COMPOSANTS EXTERNES ──────────────────────────────────────────────
vi.mock('@mui/material/Box', () => ({
  default: (props: any) => <div data-testid="Box">{props.children}</div>
}))
vi.mock('@mui/material/Typography', () => ({
  default: (props: any) => <h1 data-testid="Typography">{props.children}</h1>
}))
vi.mock('@mui/material/Pagination', () => ({
  default: (props: any) => (
    <div data-testid="Pagination">
      <span>count:{props.count} page:{props.page}</span>
      <button onClick={() => props.onChange(null, 2)}>NextPage</button>
    </div>
  )
}))
vi.mock('../components/Seo', () => ({
  default: (props: any) => <div data-testid="Seo">{props.title}</div>
}))
vi.mock('../components/OlympicLoader', () => ({
  default: () => <div data-testid="Loader">Loading…</div>
}))
vi.mock('../components/PageWrapper', () => ({
  PageWrapper: (props: any) => <div data-testid="Wrapper">{props.children}</div>
}))
vi.mock('../components/ErrorDisplay', () => ({
  ErrorDisplay: (props: any) => (
    <div data-testid="ErrorDisplay">
      <div data-testid="ErrorTitle">{props.title}</div>
      {props.showRetry && <button onClick={props.onRetry}>{props.retryButtonText}</button>}
      <div data-testid="ErrorMessage">{props.message}</div>
      {props.showHome && <button onClick={props.onHome}>{props.homeButtonText}</button>}
    </div>
  )
}))
vi.mock('../components/ProductsFilters', () => ({
  ProductsFilters: (props: any) => (
    <div data-testid="Filters">
      <pre>{JSON.stringify(props.filters)}</pre>
      <button onClick={() => props.onChange({ name: 'X' })}>ApplyFilter</button>
    </div>
  )
}))
vi.mock('../components/AdminProductGrid', () => ({
  AdminProductGrid: (props: any) => (
    <div data-testid="Grid">
      {props.products.map((p: any) => (
        <div key={p.id} data-testid="Product">{p.name}</div>
      ))}
      <button onClick={() => props.onViewDetails(5)}>ViewDetails</button>
      <button onClick={() => props.onSave(6, { price: 1, sale: 0, stock_quantity: 2 })}>Save</button>
      <button onClick={() => props.onRefresh()}>Refresh</button>
      <button onClick={() => props.onDuplicate(7)}>Duplicate</button>
      <button onClick={() => props.onCreate()}>Create</button>
    </div>
  )
}))
// --- Ajout d'un bouton RefreshXxx dans chaque modal pour tester onRefresh
vi.mock('../components/AdminProductDetailsModal', () => ({
  AdminProductDetailsModal: (props: any) => (
    <div data-testid="DetailsModal">
      open:{String(props.open)} id:{props.productId}
      <button onClick={props.onClose}>CloseDetails</button>
      <button onClick={props.onRefresh}>RefreshDetails</button>
    </div>
  )
}))
vi.mock('../components/AdminProductDuplicationModal', () => ({
  AdminProductDuplicationModal: (props: any) => (
    <div data-testid="DuplicationModal">
      open:{String(props.open)} id:{props.productId}
      <button onClick={props.onClose}>CloseDuplication</button>
      <button onClick={props.onRefresh}>RefreshDuplication</button>
    </div>
  )
}))
vi.mock('../components/AdminProductCreateModal', () => ({
  AdminProductCreateModal: (props: any) => (
    <div data-testid="CreateModal">
      open:{String(props.open)}
      <button onClick={props.onClose}>CloseCreate</button>
      <button onClick={props.onRefresh}>RefreshCreate</button>
    </div>
  )
}))

// ─── LES TESTS ────────────────────────────────────────────────────────────────
describe('AdminProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLangStore.mockReturnValue('en')
    mockAuthStore.mockImplementation(selector => selector({ authToken: 'token' }))
  })

  it('affiche ErrorDisplay si error non-null et gère retry', async () => {
    // 1) on simule d’abord un état d’erreur
    mockAdminProducts.mockReturnValue({
      products: [], total: 0, loading: false, error: 'oops', validationErrors: null
    })

    render(<AdminProductsPage />)

    // useAdminProducts a été appelé une première fois
    expect(mockAdminProducts).toHaveBeenCalledTimes(1)

    // 2) on clique sur Retry
    userEvent.click(screen.getByText('errors.retry'))

    // 3) après le setFilters, AdminProductsPage doit relancer useAdminProducts
    await waitFor(() =>
      expect(mockAdminProducts).toHaveBeenCalledTimes(2)
    )
  })

  it('affiche loader quand loading=true', () => {
    mockAdminProducts.mockReturnValue({
      products: [], total: 0, loading: true, error: null, validationErrors: null
    })
    render(<AdminProductsPage />)
    expect(screen.getByTestId('Loader')).toBeInTheDocument()
    expect(screen.queryByTestId('Grid')).toBeNull()
  })

  it('affiche grille, pagination, gère filters, pagination, details, duplication, create, save, refresh', async () => {
    mockAdminProducts.mockReturnValue({
      products: [{ id: 1, name: 'P1' }],
      total: 30, loading: false, error: null, validationErrors: null
    })
    const updateFn = vi.fn(async () => true)
    mockUpdatePricing.mockReturnValue(updateFn)

    render(<AdminProductsPage />)

    // grille, produit et pagination initiale
    expect(screen.getByTestId('Grid')).toBeInTheDocument()
    expect(screen.getByText('P1')).toBeInTheDocument()
    expect(screen.getByTestId('Pagination')).toHaveTextContent('count:2 page:1')

    // changement de page
    userEvent.click(screen.getByText('NextPage'))
    await waitFor(() => {
      const pre = screen.getByTestId('Filters').querySelector('pre')!
      expect(JSON.parse(pre.textContent!).page).toBe(2)
    })

    // application de filtre
    userEvent.click(screen.getByText('ApplyFilter'))
    await waitFor(() => {
      const pre = screen.getByTestId('Filters').querySelector('pre')!
      expect(JSON.parse(pre.textContent!).name).toBe('X')
    })

    // onRefresh dans la grille
    userEvent.click(screen.getByText('Refresh'))
    // on ne vérifie rien de spécifique, mais on couvre la ligne onRefresh={()=>…}

    // modale détails
    userEvent.click(screen.getByText('ViewDetails'))
    await waitFor(() => {
      const d = screen.getByTestId('DetailsModal')
      expect(d).toHaveTextContent('open:true')
      expect(d).toHaveTextContent('id:5')
    })
    userEvent.click(screen.getByText('RefreshDetails'))
    await waitFor(() => {
      // la modale reste ouverte, on couvre onRefresh()
      expect(screen.getByTestId('DetailsModal')).toHaveTextContent('open:true')
    })
    userEvent.click(screen.getByText('CloseDetails'))
    await waitFor(() => {
      expect(screen.getByTestId('DetailsModal')).toHaveTextContent('open:false')
    })

    // modale duplication
    userEvent.click(screen.getByText('Duplicate'))
    await waitFor(() => {
      const d2 = screen.getByTestId('DuplicationModal')
      expect(d2).toHaveTextContent('open:true')
      expect(d2).toHaveTextContent('id:7')
    })
    userEvent.click(screen.getByText('RefreshDuplication'))
    await waitFor(() => {
      expect(screen.getByTestId('DuplicationModal')).toHaveTextContent('open:true')
    })
    userEvent.click(screen.getByText('CloseDuplication'))
    await waitFor(() => {
      expect(screen.getByTestId('DuplicationModal')).toHaveTextContent('open:false')
    })

    // modale création
    userEvent.click(screen.getByText('Create'))
    await waitFor(() => {
      expect(screen.getByTestId('CreateModal')).toHaveTextContent('open:true')
    })
    userEvent.click(screen.getByText('RefreshCreate'))
    await waitFor(() => {
      expect(screen.getByTestId('CreateModal')).toHaveTextContent('open:true')
    })
    userEvent.click(screen.getByText('CloseCreate'))
    await waitFor(() => {
      expect(screen.getByTestId('CreateModal')).toHaveTextContent('open:false')
    })

    // onSave / updatePricing
    userEvent.click(screen.getByText('Save'))
    await waitFor(() => {
      expect(updateFn).toHaveBeenCalledWith(
        6,
        { price: 1, sale: 0, stock_quantity: 2 }
      )
    })
  })

  it('exerce la branche validationErrors sans planter', () => {
    mockAdminProducts.mockReturnValue({
      products: [], total: 0, loading: false, error: null,
      validationErrors: {
        sort_by: ['err'], date: ['err'], name: ['err'],
        category: ['err'], location: ['err'], places: ['err']
      }
    })
    render(<AdminProductsPage />)
    expect(screen.getByTestId('Filters')).toBeInTheDocument()
  })

  it('nettoie les filtres quand validationErrors est présent et fallback pagination à 1', async () => {
    // 1) on mock useAdminProducts pour renvoyer validationErrors complet et total=0
    (useAdminProducts as Mock).mockReturnValue({
      products: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: {
        sort_by:   ['err'],
        date:      ['err'],
        name:      ['err'],
        category:  ['err'],
        location:  ['err'],
        places:    ['err'],
      }
    })

    render(<AdminProductsPage />)

    // 2) on récupère la balise <pre> contenant le JSON
    const filtersContainer = await screen.findByTestId('Filters')
    const pre = filtersContainer.querySelector('pre')
    expect(pre).toBeTruthy() // sanity check
    const filters = JSON.parse(pre!.textContent!)

    // 3) assertions sur chaque champ réinitialisé
    expect(filters.sortBy).toBe('name')
    expect(filters.order).toBe('asc')
    expect(filters.date).toBe('')
    expect(filters.name).toBe('')
    expect(filters.category).toBe('')
    expect(filters.location).toBe('')
    expect(filters.places).toBe(0)

    // 4) pagination fallback à 1
    expect(filters.page).toBe(1)
  })

  it('nettoie bien tous les filtres quand validationErrors est rempli', async () => {
    // 1) on mocke useAdminProducts pour envoyer TOUTES les clefs de validationErrors
    (useAdminProducts as Mock).mockReturnValue({
      products: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: {
        sort_by:   ['err'],
        date:      ['err'],
        name:      ['err'],
        category:  ['err'],
        location:  ['err'],
        places:    ['err'],
      },
    })

    render(<AdminProductsPage />)

    // 2) récupère le container des filtres
    const filtersContainer = await screen.findByTestId('Filters')
    // 3) lit le <pre> qui contient le JSON
    const pre = filtersContainer.querySelector('pre')
    expect(pre).toBeTruthy()

    // 4) parse et vérifie QUE CHACUN de tes if a bien modifié le filtre
    const filt = JSON.parse(pre!.textContent!)
    expect(filt.sortBy).toBe('name')
    expect(filt.order).toBe('asc')
    expect(filt.date).toBe('')
    expect(filt.name).toBe('')
    expect(filt.category).toBe('')
    expect(filt.location).toBe('')
    expect(filt.places).toBe(0)
    // et la page doit retomber à 1
    expect(filt.page).toBe(1)
  })

  it('affiche une pagination avec count=1 même si total/perPage=0', async () => {
    // 1) on mocke useAdminProducts pour retourner un produit (pour déclencher la pagination)
    (useAdminProducts as Mock).mockReturnValue({
      products: [{ id: 123, /* autres props non utilisées par le test */ }],
      total: 0,
      loading: false,
      error: null,
      validationErrors: null,
    })

    render(<AdminProductsPage />)

    // 2) on attend la pagination (puisque products.length > 0)
    const pagination = await screen.findByTestId('Pagination')
    // 3) on vérifie le fallback count = 1 et page = 1
    expect(pagination).toHaveTextContent(/count:1/)
    expect(pagination).toHaveTextContent(/page:1/)
  })

  it('affiche une pagination avec count=1 même si total/perPage=0', async () => {
    // 1) Mock de useAdminProducts pour 1 produit et total = 0
    (useAdminProducts as Mock).mockReturnValue({
      products: [{ id: 123, name: 'P1', price: 10, /* ... */ }],
      total: 0,
      loading: false,
      error: null,
      validationErrors: null,
    });

    render(<AdminProductsPage />);

    // 2) On doit trouver la pagination (puisque products.length > 0)
    const pagination = await screen.findByTestId('Pagination');
    // 3) On vérifie que "count: 1" y apparaît
    expect(pagination).toHaveTextContent(/count:1/);
    // et que la page affichée est bien la page 1 par défaut
    expect(pagination).toHaveTextContent(/page:1/);
  });

  it('nettoie bien tous les filtres quand validationErrors est rempli', async () => {
    // 1) on fait renvoyer TOUTES les clefs dans validationErrors
    (useAdminProducts as Mock).mockReturnValue({
      products: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: {
        sort_by:   ['err'],
        date:      ['err'],
        name:      ['err'],
        category:  ['err'],
        location:  ['err'],
        places:    ['err'],
      },
    })

    render(<AdminProductsPage />)

    // 2) on récupère le container des filtres
    const filtersContainer = await screen.findByTestId('Filters')
    // 3) on lit le <pre> qui contient le JSON
    const pre = filtersContainer.querySelector('pre')
    expect(pre).toBeTruthy()

    // 4) on parse et on vérifie que chaque filtre a bien été ré-initialisé
    const filt = JSON.parse(pre!.textContent!)
    expect(filt.sortBy).toBe('name')
    expect(filt.order).toBe('asc')
    expect(filt.date).toBe('')
    expect(filt.name).toBe('')
    expect(filt.category).toBe('')
    expect(filt.location).toBe('')
    expect(filt.places).toBe(0)
    expect(filt.page).toBe(1)  // pagination remise à 1
  })
})