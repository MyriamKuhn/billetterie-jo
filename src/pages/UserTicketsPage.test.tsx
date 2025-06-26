import { screen, fireEvent, renderWithProviders } from '../tests/test-utils'
import '@testing-library/jest-dom'
import { vi, type Mock } from 'vitest'

// --- Mocks ---
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')
  return {
    ...actual,
    // leave initReactI18next, Trans, withTranslation, etc. alone
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en', changeLanguage: async () => {} },
    }),
  }
})

vi.mock('../hooks/useTickets', () => ({
  useTickets: vi.fn(),
}))

vi.mock('../components/TicketsFilters', () => ({
  __esModule: true,
  TicketsFilters: (props: any) => (
    <div data-testid="tickets-filters" data-filters={JSON.stringify(props.filters)}>
      <button
        data-testid="change-filters"
        onClick={() => props.onChange({ page: props.filters.page + 1 })}
      >change</button>
    </div>
  ),
}))

vi.mock('../components/TicketGrid', () => ({
  __esModule: true,
  TicketGrid: (props: any) => <div data-testid="ticket-grid" {...props} />,
}))

vi.mock('../components/OlympicLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" role="loader" />,
}))

vi.mock('../components/ErrorDisplay', () => ({
  __esModule: true,
  ErrorDisplay: (props: any) => (
    <div>
      <h1>{props.title}</h1>
      <p>{props.message}</p>
      {props.showRetry && <button onClick={props.onRetry}>{props.retryButtonText}</button>}
      {props.showHome  && <button>{props.homeButtonText}</button>}
    </div>
  ),
}))

import '@testing-library/jest-dom'
import UserTicketsPage from './UserTicketsPage'
import { useTickets } from '../hooks/useTickets'

const mockedUseTickets = useTickets as unknown as Mock

describe('UserTicketsPage  (RTL)', () => {
  beforeEach(() => {
    mockedUseTickets.mockReturnValue({
      tickets: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: null,
    })
  })

  it('renders ErrorDisplay when error occurs', () => {
    mockedUseTickets.mockReturnValueOnce({
      tickets: [],
      total: 0,
      loading: false,
      error: new Error('fail'),
      validationErrors: null,
    })
    renderWithProviders(<UserTicketsPage  />)
    expect(screen.getByText('errors.title')).toBeInTheDocument()
  })

  it('shows loader when loading', () => {
    mockedUseTickets.mockReturnValueOnce({
      tickets: [],
      total: 0,
      loading: true,
      error: null,
      validationErrors: null,
    })
    renderWithProviders(<UserTicketsPage  />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
    expect(screen.queryByTestId('ticket-grid')).toBeNull()
  })

  it('shows TicketGrid and no pagination when no tickets', () => {
    renderWithProviders(<UserTicketsPage  />)
    expect(screen.getByTestId('ticket-grid')).toBeInTheDocument()
    // pas de <nav> de pagination si tickets.length === 0
    expect(screen.queryByLabelText('pagination navigation')).toBeNull()
  })

  it('shows Pagination when tickets present and responds to page changes', () => {
    // persistent mock for both renders
    mockedUseTickets.mockReturnValue({
      tickets: [{}],
      total:   20,
      loading: false,
      error:   null,
      validationErrors: null,
    })

    renderWithProviders(<UserTicketsPage />)

    // click the "next" arrow
    const next = screen.getByRole('button', { name: 'Go to next page' })
    fireEvent.click(next)

    // now page 2 should be selected
    expect(
      screen.getByRole('button', { name: 'page 2' })
    ).toHaveClass('Mui-selected')
  })

  it('resets only invalid filters when validationErrors present', () => {
    mockedUseTickets.mockReturnValueOnce({
      tickets: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: { q: 'err', event_date_to: 'err' },
    })
    renderWithProviders(<UserTicketsPage  />)
    const filters = JSON.parse(
      screen.getByTestId('tickets-filters').getAttribute('data-filters')!
    )
    // q → status, event_date_to → event_date_to sont remis à '' ; le reste reste inchangé
    expect(filters).toEqual({
      status: '',
      per_page: 5,
      page: 1,
      event_date_from: '',
      event_date_to: '',
    })
  })

  it('resets all filters when every field has validationErrors', () => {
    mockedUseTickets.mockReturnValueOnce({
      tickets: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: {
        q: 'err',
        event_date_from: 'err',
        event_date_to: 'err',
        per_page: 'err',
        page: 'err',
      },
    })
    renderWithProviders(<UserTicketsPage  />)
    const filters = JSON.parse(
      screen.getByTestId('tickets-filters').getAttribute('data-filters')!
    )
    expect(filters).toEqual({
      status: '',
      per_page: 5,
      page: 1,
      event_date_from: '',
      event_date_to: '',
    })
  })

  it('re-renders grid after retry click', async () => {
    // 1er rendu : erreur
    mockedUseTickets
      .mockReturnValueOnce({ tickets: [], total: 0, loading: false, error: new Error('fail'), validationErrors: null })
      // 2e rendu : succès
      .mockReturnValue({ tickets: [], total: 0, loading: false, error: null, validationErrors: null })

    renderWithProviders(<UserTicketsPage  />)
    expect(screen.getByText('errors.title')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'errors.retry' }))
    expect(await screen.findByTestId('ticket-grid')).toBeInTheDocument()
  })

  it('falls back to a single page when total/per_page calculates to 0', () => {
    // au moins un ticket pour afficher la pagination, mais total = 0 → count = 1
    mockedUseTickets.mockReturnValueOnce({
      tickets: [{}],
      total: 0,
      loading: false,
      error: null,
      validationErrors: null,
    })
    renderWithProviders(<UserTicketsPage  />)

    // on ne doit voir qu'un seul bouton "page 1"
    const pages = screen.getAllByRole('button', { name: /page \d+/ })
    expect(pages).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'page 1' })).toBeInTheDocument()
  })

  it('updates filters on filter change', () => {
    // 1. Make sure useTickets returns something stable so the page renders
    mockedUseTickets.mockReturnValue({
      tickets: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: null,
    })

    renderWithProviders(<UserTicketsPage />)

    // 2. Grab the stubbed filters component and verify initial page = 1
    const filtersDiv = screen.getByTestId('tickets-filters')
    let filters = JSON.parse(filtersDiv.getAttribute('data-filters')!)
    expect(filters.page).toBe(1)

    // 3. Click the "change-filters" button, which calls onChange({ page: page + 1 })
    fireEvent.click(screen.getByTestId('change-filters'))

    // 4. Assert the filters prop has updated (page should now be 2)
    filters = JSON.parse(filtersDiv.getAttribute('data-filters')!)
    expect(filters.page).toBe(2)
  })

  it('does not reset filters when validationErrors has no relevant keys', () => {
    // validationErrors is an object, but missing both 'q' and 'event_date_to'
    mockedUseTickets.mockReturnValueOnce({
      tickets: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: { someOtherField: 'oops' },
    })

    renderWithProviders(<UserTicketsPage />)

    const filters = JSON.parse(
      screen.getByTestId('tickets-filters').getAttribute('data-filters')!
    )
    // Should remain at the initial defaults
    expect(filters).toEqual({
      status: '',
      per_page: 5,
      page: 1,
      event_date_from: '',
      event_date_to: '',
    })
  })
})
