import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'
import AdminPaymentsPage from './AdminPaymentsPage'
import * as authStoreModule from '../stores/useAuthStore'
import { useAdminPayments } from '../hooks/useAdminPayments'
import { usePaymentRefund } from '../hooks/usePaymentRefund'
import * as GridModule from '../components/AdminPaymentGrid'

// -- i18n stub --------------------------------------------------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k })
}))

// -- stores & hooks mocks --------------------------------------
vi.mock('../stores/useAuthStore', () => ({ useAuthStore: vi.fn() }))
vi.mock('../hooks/useAdminPayments', () => ({ useAdminPayments: vi.fn() }))
vi.mock('../hooks/usePaymentRefund', () => ({ usePaymentRefund: vi.fn() }))

// -- component stubs --------------------------------------------
// default export
vi.mock('../components/OlympicLoader', () => ({ default: () => <div data-testid="OlympicLoader" /> }))
// named export
vi.mock('../components/AdminPaymentGrid', () => ({ AdminPaymentGrid: () => <div data-testid="AdminPaymentGrid" /> }))
// Pagination is default
vi.mock('@mui/material/Pagination', () => ({
  default: (props: any) => (
    <button data-testid="Pagination" onClick={() => props.onChange(null, 3)}>
      page {props.page}
    </button>
  )
}))
// named export
vi.mock('../components/AdminPaymentFilters', () => ({
  AdminPaymentFilters: ({ onChange }: any) => (
    <button data-testid="Filters" onClick={() => onChange({ q: 'x', status: '', payment_method: '', per_page: 5, page: 1 })}>
      filters
    </button>
  )
}))
// default export
vi.mock('../components/Seo', () => ({ default: () => null }))
// named export
vi.mock('../components/PageWrapper', () => ({ PageWrapper: ({ children }: any) => <div>{children}</div> }))
// named export
vi.mock('../components/ErrorDisplay', () => ({
  ErrorDisplay: ({ title, message, onRetry }: any) => (
    <div data-testid="ErrorDisplay">
      <span>{title}</span>
      <span>{message}</span>
      <button onClick={onRetry}>retry</button>
    </div>
  )
}))

describe('AdminPaymentsPage', () => {
  const dummyToken = 'tok'
  let paymentsHookReturn: any
  let refundFn: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // mock token
    vi.spyOn(authStoreModule, 'useAuthStore').mockReturnValue(dummyToken)

    // mock refund hook
    refundFn = vi.fn().mockResolvedValue(true)
    ;(usePaymentRefund as Mock).mockReturnValue(refundFn)

    // default payments hook
    paymentsHookReturn = { payments: [], total: 0, loading: false, error: null, validationErrors: null }
    ;(useAdminPayments as Mock).mockReturnValue(paymentsHookReturn)
  })

  it('renders ErrorDisplay when error is set', () => {
    paymentsHookReturn.error = 'oops'
    render(<AdminPaymentsPage />)
    expect(screen.getByTestId('ErrorDisplay')).toBeInTheDocument()
    expect(screen.getByText('errors.title')).toBeInTheDocument()
    expect(screen.getByText('errors.message')).toBeInTheDocument()

    fireEvent.click(screen.getByText('retry'))
    // on retry we at least re-invoke the hook once more
    expect((useAdminPayments as Mock).mock.calls.length).toBeGreaterThan(1)
  })

  it('renders loader while loading', () => {
    paymentsHookReturn.loading = true
    render(<AdminPaymentsPage />)
    expect(screen.getByTestId('OlympicLoader')).toBeInTheDocument()
  })

  it('renders grid and updates page when payments exist', () => {
    paymentsHookReturn = { payments: [{ uuid: 'A' }], total: 12, loading: false, error: null, validationErrors: null }
    ;(useAdminPayments as Mock).mockReturnValue(paymentsHookReturn)

    render(<AdminPaymentsPage />)
    expect(screen.getByTestId('AdminPaymentGrid')).toBeInTheDocument()

    const btn = screen.getByTestId('Pagination')
    expect(btn).toHaveTextContent('page 1')

    fireEvent.click(btn)
    // after clicking, our hook should be called again with page=3
    const lastCallFilters = (useAdminPayments as Mock).mock.calls.slice(-1)[0][0]
    expect(lastCallFilters.page).toBe(3)
  })

  it('resets filters when validationErrors change', async () => {
    const { rerender } = render(<AdminPaymentsPage />)
    // initial invocation
    expect((useAdminPayments as Mock).mock.calls.length).toBeGreaterThanOrEqual(1)

    // simulate validation errors
    paymentsHookReturn.validationErrors = { q: ['err'], per_page: ['err'] }
    rerender(<AdminPaymentsPage />)

    await waitFor(() => {
      // find the last call filters
      const last = (useAdminPayments as Mock).mock.calls.slice(-1)[0][0]
      expect(last.q).toBe('')
      expect(last.per_page).toBe(5)
    })
  })

  it('passes filters to AdminPaymentFilters and reacts to its onChange', () => {
    // start with no payments so grid won’t render
    paymentsHookReturn = { payments: [], total: 0, loading: false, error: null, validationErrors: null }
    ;(useAdminPayments as Mock).mockReturnValue(paymentsHookReturn)

    render(<AdminPaymentsPage />)
    // our stubbed Filters button is rendered
    const filtersBtn = screen.getByTestId('Filters')
    expect(filtersBtn).toBeInTheDocument()

    // click it → it calls onChange with { q: 'x', ... }
    fireEvent.click(filtersBtn)

    // after that, the hook should have been called again with the updated filters
    const lastCall = (useAdminPayments as Mock).mock.calls.slice(-1)[0][0]
    expect(lastCall.q).toBe('x')
    expect(lastCall.page).toBe(1)
  })

  it('passes onSave and onRefresh into AdminPaymentGrid and they work', async () => {
    // 1️⃣ Stub one payment so <AdminPaymentGrid> actually renders
    paymentsHookReturn = {
      payments: [{ uuid: 'PAY1' }] as any[],
      total: 0,
      loading: false,
      error: null,
      validationErrors: null
    }
    ;(useAdminPayments as Mock).mockReturnValue(paymentsHookReturn)

    // 2️⃣ Spy on the already-mocked AdminPaymentGrid to capture its props
    const saved: { onSave?: any; onRefresh?: any } = {}
    vi.spyOn(GridModule, 'AdminPaymentGrid').mockImplementation((props: any) => {
      saved.onSave = props.onSave
      saved.onRefresh = props.onRefresh
      return <div data-testid="AdminPaymentGrid" />
    })

    // 3️⃣ Render the page
    render(<AdminPaymentsPage />)
    expect(screen.getByTestId('AdminPaymentGrid')).toBeInTheDocument()

    // 4️⃣ Call onSave → should invoke our refundFn
    const result = await saved.onSave('PAY1', { amount: 123 })
    expect(result).toBe(true)
    expect(refundFn).toHaveBeenCalledWith('PAY1', { amount: 123 })

    // 5️⃣ Call onRefresh → should re-trigger useAdminPayments
    const beforeCalls = (useAdminPayments as Mock).mock.calls.length
    saved.onRefresh!()
    await waitFor(() => {
      expect((useAdminPayments as Mock).mock.calls.length).toBeGreaterThan(beforeCalls)
    })
  })

  it('resets every filter field when validationErrors change', async () => {
    const { rerender } = render(<AdminPaymentsPage />);

    // initial invocation
    const initialCalls = (useAdminPayments as Mock).mock.calls.length;
    expect(initialCalls).toBeGreaterThanOrEqual(1);

    // simulate validation errors in every field
    paymentsHookReturn.validationErrors = {
      q:               ['err'],
      status:          ['err'],
      payment_method:  ['err'],
      per_page:        ['err'],
      page:            ['err'],
    };
    rerender(<AdminPaymentsPage />);

    await waitFor(() => {
      // should have re-run the hook at least once more
      expect((useAdminPayments as Mock).mock.calls.length).toBeGreaterThan(initialCalls);

      // grab the filters passed into the last hook call
      const lastFilters = (useAdminPayments as Mock).mock.calls.slice(-1)[0][0];
      expect(lastFilters.q).toBe('');
      expect(lastFilters.status).toBe('');
      expect(lastFilters.payment_method).toBe('');
      expect(lastFilters.per_page).toBe(5);
      expect(lastFilters.page).toBe(1);
    });
  });

  it('only resets q and per_page when those two validationErrors occur', async () => {
    // Render once so we have the default filters state: {q:'', status:'', payment_method:'', per_page:5, page:1}
    const { rerender } = render(<AdminPaymentsPage />);

    // Simulate validationErrors only for q and per_page
    paymentsHookReturn.validationErrors = {
      q: ['must not be empty'],
      per_page: ['too large'],
    };
    rerender(<AdminPaymentsPage />);

    await waitFor(() => {
      // Grab the filters argument passed to the last useAdminPayments call
      const lastFilters = (useAdminPayments as Mock).mock.calls.slice(-1)[0][0] as {
        q: string;
        status: string;
        payment_method: string;
        per_page: number;
        page: number;
      };

      // q and per_page should have been reset
      expect(lastFilters.q).toBe('');
      expect(lastFilters.per_page).toBe(5);

      // other fields remain at their component-defaults
      expect(lastFilters.status).toBe('');
      expect(lastFilters.payment_method).toBe('');
      expect(lastFilters.page).toBe(1);
    });
  });

  it('runs every cleanup branch when all validationErrors are present', async () => {
    const { rerender } = render(<AdminPaymentsPage />);

    // simulate validationErrors on every field:
    paymentsHookReturn.validationErrors = {
      q: ['err'],
      status: ['err'],
      payment_method: ['err'],
      per_page: ['err'],
      page: ['err'],
    };

    rerender(<AdminPaymentsPage />);

    await waitFor(() => {
      // Grab the filters argument passed to the last useAdminPayments call
      const lastFilters = (useAdminPayments as Mock).mock.calls.slice(-1)[0][0] as {
        q: string;
        status: string;
        payment_method: string;
        per_page: number;
        page: number;
      };

      // Every branch should have run, so all of these should be reset:
      expect(lastFilters.q).toBe('');
      expect(lastFilters.status).toBe('');
      expect(lastFilters.payment_method).toBe('');
      expect(lastFilters.per_page).toBe(5);
      expect(lastFilters.page).toBe(1);
    });
  });

  it('skips cleanup.q and cleanup.per_page when those validationErrors are absent', async () => {
    // start with some non‐q, non‐per_page validation errors
    paymentsHookReturn.validationErrors = {
      status: ['err'],
      payment_method: ['err'],
      page: ['err'],
    }

    const initialFilters = { ...((useAdminPayments as Mock).mock.calls.slice(-1)[0][0]) }

    // rerender to trigger the effect
    render(<AdminPaymentsPage />)

    await waitFor(() => {
      const last = (useAdminPayments as Mock).mock.calls.slice(-1)[0][0]
      // since validationErrors.q and .per_page were undefined,
      // the cleanup for q and per_page should *not* have run:
      expect(last.q).toBe(initialFilters.q)
      expect(last.per_page).toBe(initialFilters.per_page)
      // but the others should have been reset
      expect(last.status).toBe('')
      expect(last.payment_method).toBe('')
      expect(last.page).toBe(1)
    })
  })

  it('covers the selector (state) => state.authToken by executing it', () => {
    // Arrange: spy on useAuthStore and supply a complete AuthState
    vi.spyOn(authStoreModule, 'useAuthStore').mockImplementation(selector => {
      const fakeState = {
        authToken: 'MY_FAKE_TOKEN',
        // role must be UserRole | null; null is safe
        role: null,
        remember: false,
        setToken: () => {},
        clearToken: () => {},
      }
      return selector(fakeState)
    })

    // Act
    render(<AdminPaymentsPage />)

    // Assert: useAdminPayments should have been called with that token
    expect(useAdminPayments).toHaveBeenCalledWith(
      expect.any(Object),  // filters
      'MY_FAKE_TOKEN'
    )
  })
})

