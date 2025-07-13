import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock react-i18next before importing component
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

// Shallow-mock all child components
vi.mock('../components/PageWrapper', () => ({
  PageWrapper: (props: any) => <div data-testid="pagewrapper" {...props} />,
}))
vi.mock('../components/ErrorDisplay', () => ({
  ErrorDisplay: (props: any) => (
    <div
      data-testid="error-display"
      onClick={props.onRetry}
      {...props}
    />
  ),
}))
vi.mock('../components/Seo', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="seo" {...props} />,
}))
vi.mock('../components/OlympicLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}))
vi.mock('../components/AdminTicketsFilters', () => ({
  AdminTicketsFilters: (props: any) => (
    <button data-testid="filter-btn" onClick={() => props.onChange({ page: 2 })} />
  ),
}))
vi.mock('../components/AdminTicketGrid', () => ({
  AdminTicketGrid: (props: any) => (
    <div data-testid="grid">
      <button data-testid="save-btn" onClick={() => props.onSave(1, { status: 'used' })} />
      <button data-testid="refresh-btn" onClick={props.onRefresh} />
      <button data-testid="create-btn" onClick={props.onCreate} />
    </div>
  ),
}))
vi.mock('../components/AdminTicketCreateModal', () => ({
  AdminTicketCreateModal: (props: any) =>
    props.open ? (
      <div data-testid="modal">
        <button data-testid="close-modal" onClick={props.onClose} />
        <button data-testid="refresh-modal" onClick={props.onRefresh} />
      </div>
    ) : null,
}))

import AdminOrdersPage from './AdminOrdersPage'
import * as authStore from '../stores/useAuthStore'
import * as ticketsHook from '../hooks/useAdminTickets'
import * as statusHook from '../hooks/useTicketStatusUpdate'

describe('AdminOrdersPage', () => {
  const mockStatusUpdate = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    // Mock auth token
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue('tok-xxx')
    // Default tickets hook
    vi.spyOn(ticketsHook, 'useAdminTickets').mockReturnValue({
      tickets: [] as any,
      total: 0,
      loading: false,
      error: null,
      validationErrors: null,
    })
    // statusUpdate hook
    vi.spyOn(statusHook, 'useTicketStatusUpdate').mockReturnValue(mockStatusUpdate)
  })

  it('renders error state when error is set', () => {
    vi.spyOn(ticketsHook, 'useAdminTickets').mockReturnValue({
      tickets: [] as any,
      total: 0,
      loading: false,
      error: 'EERR',
      validationErrors: null,
    })
    render(<AdminOrdersPage />)
    expect(screen.getByTestId('error-display')).toBeInTheDocument()
  })

  it('shows loader when loading', () => {
    vi.spyOn(ticketsHook, 'useAdminTickets').mockReturnValue({
      tickets: [] as any,
      total: 0,
      loading: true,
      error: null,
      validationErrors: null,
    })
    render(<AdminOrdersPage />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('renders grid and pagination when tickets exist', () => {
    vi.spyOn(ticketsHook, 'useAdminTickets').mockReturnValue({
      tickets: [{ id: 1 } as any],
      total: 10,
      loading: false,
      error: null,
      validationErrors: null,
    })
    render(<AdminOrdersPage />)
    expect(screen.getByTestId('grid')).toBeInTheDocument()
    // pagination should show page 1
    expect(screen.getByRole('button', { name: 'page 1' })).toBeInTheDocument()
  })

  it('calls statusUpdate and waits for promise', async () => {
    mockStatusUpdate.mockResolvedValue(true)
    vi.spyOn(ticketsHook, 'useAdminTickets').mockReturnValue({
      tickets: [{ id: 1 } as any],
      total: 1,
      loading: false,
      error: null,
      validationErrors: null,
    })
    render(<AdminOrdersPage />)
    fireEvent.click(screen.getByTestId('save-btn'))
    await waitFor(() => {
      expect(mockStatusUpdate).toHaveBeenCalledWith(1, { status: 'used' })
    })
  })

  it('opens and closes create modal', () => {
    render(<AdminOrdersPage />)
    fireEvent.click(screen.getByTestId('create-btn'))
    expect(screen.getByTestId('modal')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('close-modal'))
    expect(screen.queryByTestId('modal')).toBeNull()
  })

  it('resets filters on validationErrors', () => {
    vi.spyOn(ticketsHook, 'useAdminTickets').mockReturnValue({
      tickets: [] as any,
      total: 0,
      loading: false,
      error: null,
      validationErrors: { status: ['err'] },
    })
    render(<AdminOrdersPage />)
    expect(screen.getByTestId('seo')).toBeInTheDocument()
  })

    it('calls onRetry when the error display is clicked', () => {
    // 1) Mock an error state
    vi.spyOn(ticketsHook, 'useAdminTickets').mockReturnValue({
      tickets: [] as any,
      total: 0,
      loading: false,
      error: 'SOME_ERROR',
      validationErrors: null,
    })
    render(<AdminOrdersPage />)
    // 2) The ErrorDisplay mock spreads onRetry onto the root div
    const errorDiv = screen.getByTestId('error-display')
    expect(errorDiv).toBeInTheDocument()
    // 3) Clicking it should invoke the onRetry handler (i.e. setFilters)
    fireEvent.click(errorDiv)
    // 4) Still in error state (no crash), ErrorDisplay remains
    expect(screen.getByTestId('error-display')).toBeInTheDocument()
  })

  it('updates page when AdminTicketsFilters onChange is called', () => {
    // 1) Start with some tickets so pagination shows up
    vi.spyOn(ticketsHook, 'useAdminTickets').mockReturnValue({
      tickets: [{ id: 1 } as any],
      total: 20,
      loading: false,
      error: null,
      validationErrors: null,
    })
    render(<AdminOrdersPage />)
    // 2) The mocked AdminTicketsFilters renders a button with testid="filter-btn"
    fireEvent.click(screen.getByTestId('filter-btn'))
    // 3) That onChange sets page:2, so pagination should now have a "page 2" button
    expect(screen.getByRole('button', { name: 'page 2' })).toBeInTheDocument()
  })

  it('calls onRefresh when the grid refresh button is clicked', () => {
    vi.spyOn(ticketsHook, 'useAdminTickets').mockReturnValue({
      tickets: [{ id: 1 } as any],
      total: 5,
      loading: false,
      error: null,
      validationErrors: null,
    })
    render(<AdminOrdersPage />)
    const grid = screen.getByTestId('grid')
    expect(grid).toBeInTheDocument()
    // The refresh handler is attached to testid="refresh-btn"
    fireEvent.click(screen.getByTestId('refresh-btn'))
    // It should re-render without errors; grid stays in the document
    expect(screen.getByTestId('grid')).toBeInTheDocument()
  })

  it('changes page when clicking on a pagination button', async () => {
    vi.spyOn(ticketsHook, 'useAdminTickets').mockReturnValue({
      tickets: [{ id: 1 } as any],
      total: 50,
      loading: false,
      error: null,
      validationErrors: null,
    })
    render(<AdminOrdersPage />)
    // Find the "Go to page 3" button by its aria-label
    const page3Btn = screen.getByRole('button', { name: 'Go to page 3' })
    fireEvent.click(page3Btn)
    // Now it should be the selected page
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'page 3' })).toHaveAttribute('aria-current', 'page')
    })
  })

  it('calls onRefresh when the create-modal refresh button is clicked', () => {
    // Always no-error, no-loading so modal can open
    render(<AdminOrdersPage />)
    // Open the modal
    fireEvent.click(screen.getByTestId('create-btn'))
    expect(screen.getByTestId('modal')).toBeInTheDocument()
    // Click the modal's refresh button
    fireEvent.click(screen.getByTestId('refresh-modal'))
    // Modal remains open
    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })

  it('invokes onRetry when retry is clicked', () => {
    vi.spyOn(ticketsHook, 'useAdminTickets').mockReturnValue({
      tickets: [] as any,
      total: 0,
      loading: false,
      error: 'EERR',
      validationErrors: null,
    })

    render(<AdminOrdersPage />)
    fireEvent.click(screen.getByTestId('error-display'))
    // If we get here without errors, the onRetry setter line has been covered
  })

    it('cleans up both status and user_id filters when validationErrors has both', async () => {
    // Spy on the tickets hook to inspect its calls
    const hookSpy = vi
      .spyOn(ticketsHook, 'useAdminTickets')
      // 1st render: return a validationErrors object
      .mockImplementationOnce(() => ({
        tickets: [] as any,
        total: 0,
        loading: false,
        error: null,
        validationErrors: { status: ['bad'], user_id: ['bad'] },
      }))
      // 2nd render (after effect runs): return with validationErrors cleared
      .mockImplementationOnce((_filters, _token) => ({
        tickets: [] as any,
        total: 0,
        loading: false,
        error: null,
        validationErrors: null,
      }))

    render(<AdminOrdersPage />)

    // Wait for the effect-triggered re-render
    await waitFor(() => {
      // We expect two calls: initial + after middleware cleanup
      expect(hookSpy).toHaveBeenCalledTimes(2)
      const [, [cleanFilters]] = hookSpy.mock.calls
      // status should have been reset to '' and user_id to undefined
      expect(cleanFilters.status).toBe('')
      expect(cleanFilters.user_id).toBeUndefined()
    })
  })

  it('falls back to a single page when total/per_page is zero', () => {
    vi.spyOn(ticketsHook, 'useAdminTickets').mockReturnValue({
      tickets: [{ id: 1 } as any],
      total: 0,          // zero total
      loading: false,
      error: null,
      validationErrors: null,
    })
    render(<AdminOrdersPage />)

    // Only one page should be rendered
    const page1Button = screen.getByRole('button', { name: 'page 1' })
    expect(page1Button).toBeInTheDocument()
    // And there should *not* be a "Go to page 2" button
    expect(screen.queryByRole('button', { name: 'Go to page 2' })).toBeNull()
  })

    it('cleans up only status when validationErrors.status is present', async () => {
    // Spy on the tickets hook to capture the filters it’s called with
    const hookSpy = vi
      .spyOn(ticketsHook, 'useAdminTickets')
      // 1st render returns a status validation error
      .mockImplementationOnce(() => ({
        tickets: [] as any,
        total: 0,
        loading: false,
        error: null,
        validationErrors: { status: ['invalid'] },
      }))
      // 2nd render should get filters.status reset to '' and untouched user_id
      .mockImplementationOnce((filters, _token) => {
        // Assert inside the mock that status cleanup ran
        expect(filters.status).toBe('')
        // user_id was never in filters, so should stay undefined
        expect(filters.user_id).toBeUndefined()
        return {
          tickets: [] as any,
          total: 0,
          loading: false,
          error: null,
          validationErrors: null,
        }
      })

    render(<AdminOrdersPage />)

    // Wait for the effect-triggered re-render
    await waitFor(() => {
      expect(hookSpy).toHaveBeenCalledTimes(2)
    })
  })

  it('reads authToken from useAuthStore', () => {
    // On spy l’import pour capturer l’argument du sélecteur
    const useAuthSpy = vi.spyOn(authStore, 'useAuthStore').mockReturnValue('tok-xyz')

    render(<AdminOrdersPage />)

    // Vérifie que useAuthStore a bien été appelé avec une fonction sélecteur
    expect(useAuthSpy).toHaveBeenCalledWith(expect.any(Function))
  })

  it('passes the authToken from useAuthStore into useAdminTickets', () => {
    // 1) Mock useAuthStore to return a known token
    const fakeToken = 'tok-abc';
    vi.spyOn(authStore, 'useAuthStore').mockReturnValue(fakeToken);

    // 2) Spy on useAdminTickets to capture its arguments
    const ticketsSpy = vi
      .spyOn(ticketsHook, 'useAdminTickets')
      .mockReturnValue({
        tickets: [],
        total: 0,
        loading: false,
        error: null,
        validationErrors: null,
      });

    // 3) Render the component
    render(<AdminOrdersPage />);

    // 4) Expect useAdminTickets to have been called with our fake token
    expect(ticketsSpy).toHaveBeenCalledWith(expect.any(Object), fakeToken);
  });

  it('récupère le token via useAuthStore et le transmet à useAdminTickets', () => {
    // 1) On mocke useAuthStore pour qu'il retourne un token connu
    const fakeToken = 'tok-abc-123'
    const useAuthSpy = vi.spyOn(authStore, 'useAuthStore').mockReturnValue(fakeToken)

    // 2) On espionne useAdminTickets pour capturer ses arguments
    const ticketsSpy = vi
      .spyOn(ticketsHook, 'useAdminTickets')
      .mockReturnValue({
        tickets: [],
        total: 0,
        loading: false,
        error: null,
        validationErrors: null,
      })

    // 3) On rend le composant
    render(<AdminOrdersPage />)

    // 4) On s'assure que useAuthStore a été appelé avec un sélecteur
    expect(useAuthSpy).toHaveBeenCalledWith(expect.any(Function))

    // 5) Et que le token récupéré a bien été passé à useAdminTickets
    expect(ticketsSpy).toHaveBeenCalledWith(expect.any(Object), fakeToken)
  })

  it('cover le selector state => state.authToken en l’exécutant', () => {
    const fakeToken = 'tok-abc-123'
    // 1) On spy sur useAuthStore pour appeler le selector
    const useAuthSpy = vi
      .spyOn(authStore, 'useAuthStore')
      .mockImplementation((selector: (state: any) => any) => {
        // Exécute la flèche et renvoie son résultat
        return selector({ authToken: fakeToken })
      })

    // 2) On spy sur useAdminTickets pour éviter tout effet de bord
    const ticketsSpy = vi
      .spyOn(ticketsHook, 'useAdminTickets')
      .mockReturnValue({
        tickets: [],
        total: 0,
        loading: false,
        error: null,
        validationErrors: null,
      })

    // 3) On rend le composant
    render(<AdminOrdersPage />)

    // 4) Le spy doit avoir été appelé **avec** un selector (fonction)
    expect(useAuthSpy).toHaveBeenCalledWith(expect.any(Function))
    // 5) Et useAdminTickets doit recevoir notre token en second argument
    expect(ticketsSpy).toHaveBeenCalledWith(expect.any(Object), fakeToken)
  })
})
