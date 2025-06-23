import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi, type Mock } from 'vitest'

// router + i18n + hook mocks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => () => {} }
})
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } })
}))
vi.mock('../hooks/useInvoices', () => ({ useInvoices: vi.fn() }))
vi.mock('../stores/useLanguageStore', () => ({ useLanguageStore: vi.fn() }))

// === STUB CHILD COMPONENTS ===
vi.mock('../components/InvoiceGrid', () => ({
  __esModule: true,
  default: (props: any) =>
    <div data-testid="invoice-grid" {...props} />,
  InvoiceGrid: (props: any) =>
    <div data-testid="invoice-grid" {...props} />
}))
vi.mock('../components/OlympicLoader', () => ({
  __esModule: true,
  default: () =>
    <div data-testid="loader" role="loader" />
}))
vi.mock('../components/InvoicesFilters', () => ({
  __esModule: true,
  InvoicesFilters: (props: any) => (
    <div data-testid="invoices-filters" data-filters={JSON.stringify(props.filters)}>
      <button data-testid="change-filters" onClick={() => props.onChange({ page: props.filters.page + 1 })}>
        change
      </button>
    </div>
  )
}))

import InvoicesPage from './InvoicesPage'
import { useInvoices } from '../hooks/useInvoices'
import { useLanguageStore } from '../stores/useLanguageStore'
import { MemoryRouter } from 'react-router-dom'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

describe('InvoicesPage (RTL)', () => {
  const mockedUseInvoices = useInvoices as unknown as Mock
  const mockedLangStore = useLanguageStore as unknown as Mock

  beforeEach(() => {
    mockedLangStore.mockReturnValue('en')
    mockedUseInvoices.mockReturnValue({
      invoices: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: null,
    })
  })

  const renderPage = () =>
    render(
      <MemoryRouter>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <InvoicesPage />
        </LocalizationProvider>
      </MemoryRouter>
    )

  it('renders ErrorDisplay when error occurs', () => {
    mockedUseInvoices.mockReturnValue({
      invoices: [],
      total: 0,
      loading: false,
      error: new Error('fail'),
      validationErrors: null,
    })
    renderPage()
    expect(screen.getByText('errors.title')).toBeInTheDocument()
    expect(screen.getByText('errors.message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'invoices.retry' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'invoices.go_home' })).toBeVisible()
  })

  it('shows loader when loading', () => {
    mockedUseInvoices.mockReturnValue({
      invoices: [],
      total: 0,
      loading: true,
      error: null,
      validationErrors: null,
    })
    renderPage()
    expect(screen.getByTestId('loader')).toBeInTheDocument()
    expect(screen.queryByTestId('invoice-grid')).toBeNull()
  })

  it('shows InvoiceGrid and no Pagination when no invoices', () => {
    renderPage()
    expect(screen.getByTestId('invoice-grid')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('shows Pagination when invoices present and responds to page changes', () => {
    mockedUseInvoices.mockReturnValue({
      invoices: [{}],
      total: 30,
      loading: false,
      error: null,
      validationErrors: null,
    })
    renderPage()
    const next = screen.getByRole('button', { name: 'Go to page 2' })
    fireEvent.click(next)
    expect(screen.getByRole('button', { name: 'page 2' })).toHaveClass('Mui-selected')
  })

  it('resets filters when validationErrors present', () => {
    mockedUseInvoices.mockReturnValue({
      invoices: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: { status: 'err', date_to: 'err' }
    })
    renderPage()
    const filtersDiv = screen.getByTestId('invoices-filters')
    const filters = JSON.parse(filtersDiv.getAttribute('data-filters')!)
    expect(filters).toEqual({
      status: '',
      date_from: '',
      date_to: '',
      sort_by: 'created_at',
      sort_order: 'desc',
      per_page: 15,
      page: 1
    })
  })

  it('re-renders list after retry click', async () => {
    // First call: error state
    mockedUseInvoices.mockReturnValueOnce({ invoices: [], total: 0, loading: false, error: new Error('fail'), validationErrors: null })
      // Next calls: normal state
      .mockReturnValue({ invoices: [], total: 0, loading: false, error: null, validationErrors: null })

    renderPage()
    expect(screen.getByText('errors.title')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'invoices.retry' }))

    expect(await screen.findByTestId('invoice-grid')).toBeInTheDocument()
  })

  it('updates filters on filter change', () => {
    mockedUseInvoices.mockReturnValue({
      invoices: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: null,
    })
    renderPage()
    // initial filters page = 1
    let filters = JSON.parse(screen.getByTestId('invoices-filters').getAttribute('data-filters')!)
    expect(filters.page).toBe(1)
    // click change-filters: triggers onChange
    fireEvent.click(screen.getByTestId('change-filters'))
    filters = JSON.parse(screen.getByTestId('invoices-filters').getAttribute('data-filters')!)
    expect(filters.page).toBe(2)
  })

  it('resets all filters when validationErrors for every field', () => {
    mockedUseInvoices.mockReturnValue({
      invoices: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: {
        status:    'err',
        date_from: 'err',
        date_to:   'err',
        sort_by:   'err',
        sort_order:'err',
        per_page:  'err',
        page:      'err',
      },
    });
    renderPage();
    const filters = JSON.parse(
      screen.getByTestId('invoices-filters').getAttribute('data-filters')!
    );
    expect(filters).toEqual({
      status:     '',
      date_from:  '',
      date_to:    '',
      sort_by:    'created_at',
      sort_order: 'desc',
      per_page:   15,
      page:       1,
    });
  });

  it('falls back to a single page when total/per_page calculates to 0', () => {
    // at least one invoice so the grid shows, but total = 0 → count = Math.ceil(0/15)||1 === 1
    mockedUseInvoices.mockReturnValue({
      invoices: [{}],
      total:    0,
      loading:  false,
      error:    null,
      validationErrors: null,
    });
    renderPage();

    // Should render exactly one page button, labelled "page 1"
    const pages = screen.getAllByRole('button', { name: /page \d+/ });
    expect(pages).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'page 1' })).toBeInTheDocument();

    // And there should be no "Go to page 2"
    expect(screen.queryByRole('button', { name: /Go to page 2/ })).toBeNull();
  });

  it('reads lang from store and passes it into useInvoices', () => {
    // make our mock actually call the selector fn with a fake store
    mockedLangStore.mockImplementation(selector => selector({ lang: 'fr' }))
    renderPage()
    // first arg is filters, second arg should be 'fr'
    expect(useInvoices).toHaveBeenCalledWith(expect.any(Object), 'fr')
  })
})
