import TestRenderer, { act } from 'react-test-renderer'
import { vi } from 'vitest'
import { renderHook } from '../tests/test-utils'
import { useInvoices } from './useInvoices'
import * as authStore from '../stores/useAuthStore'
import * as billingService from '../services/billingService'
import type { Invoice, InvoiceApiResponse, InvoiceFilters } from '../types/invoices'

const dummyFilters = {} as unknown as InvoiceFilters

describe('useInvoices', () => {
  const baseAuthState = {
    authToken: 'TKN',
    role: null as null,
    remember: false,
    setToken: vi.fn(),
    clearToken: vi.fn(),
  }

  beforeEach(() => {
    // Mock du token
    vi
      .spyOn(authStore, 'useAuthStore')
      .mockImplementation((selector) => selector(baseAuthState))

    // Reset et mock URL (pas utilisé directement ici, mais bon réflexe)
    ;(window.URL as any).createObjectURL ??= vi.fn()
    ;(window.URL as any).revokeObjectURL ??= vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renvoie une erreur "User not authenticated" si pas de token', () => {
    // override pour simuler pas de token
    const noAuth = { ...baseAuthState, authToken: null }
    vi
      .spyOn(authStore, 'useAuthStore')
      .mockImplementation((selector) => selector(noAuth))

    const filters = dummyFilters
    const { result } = renderHook(() => useInvoices(filters, 'en'))

    const state = result()
    expect(state.error).toEqual(new Error('User not authenticated'))
    expect(state.invoices).toEqual([])
    expect(state.total).toBe(0)
    expect(state.loading).toBe(false)
    expect(state.validationErrors).toBeNull()
  })

  it('fetch with success met à jour invoices, total et loading', async () => {
    const filters = dummyFilters
    const fakeInvoices: Invoice[] = [{ id: '1', amount: 100 }] as any
    const apiResp: InvoiceApiResponse = {
      status: 200,
      data: {
        data: fakeInvoices,
        meta: {
          total: 42,
          per_page: 10,
          current_page: 1,
          last_page: 1,
       },
       links: {} as any,
      },
    }
    vi.spyOn(billingService, 'getInvoices').mockResolvedValue(apiResp)

    const { result } = renderHook(() => useInvoices(filters, 'fr'))
    // juste après montage, la requête démarre
    expect(result().loading).toBe(true)

    // on laisse passer le microtask
    await act(async () => await Promise.resolve())

    const state = result()
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.validationErrors).toBeNull()
    expect(state.invoices).toEqual(fakeInvoices)
    expect(state.total).toBe(42)
  })

  it('erreur 422 → setValidationErrors mais pas error', async () => {
    const filters = dummyFilters
    const validationErrs = { field: 'required' }
    const err = {
      response: {
        status: 422,
        data: { errors: validationErrs },
      },
    }
    vi.spyOn(billingService, 'getInvoices').mockRejectedValue(err)

    const { result } = renderHook(() => useInvoices(filters, 'en'))
    await act(async () => await Promise.resolve())

    const state = result()
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.validationErrors).toEqual(validationErrs)
    expect(state.invoices).toEqual([])
    expect(state.total).toBe(0)
  })

  it('erreur générique (Error) → set error', async () => {
    const filters = dummyFilters
    const err = new Error('oops')
    vi.spyOn(billingService, 'getInvoices').mockRejectedValue(err)

    const { result } = renderHook(() => useInvoices(filters, 'en'))
    await act(async () => await Promise.resolve())

    const state = result()
    expect(state.loading).toBe(false)
    expect(state.error).toBe(err)
    expect(state.validationErrors).toBeNull()
    expect(state.invoices).toEqual([])
    expect(state.total).toBe(0)
  })

  it('cancellation empêche la mise à jour après unmount', async () => {
    // Promise manuelle pour contrôler le resolve
    let resolveFn!: (resp: InvoiceApiResponse) => void
    const pending = new Promise<InvoiceApiResponse>(resolve => {
      resolveFn = resolve
    })
    vi.spyOn(billingService, 'getInvoices').mockReturnValue(pending as any)

    let hookState!: ReturnType<typeof useInvoices>
    function HookWrapper({ filters, lang }: { filters: InvoiceFilters; lang: string }) {
      hookState = useInvoices(filters, lang)
      return null
    }

    const filters = dummyFilters
    let renderer!: TestRenderer.ReactTestRenderer
    // Mount
    act(() => {
      renderer = TestRenderer.create(<HookWrapper filters={filters} lang="en" />)
    })
    // loading est true puisque la requête est en cours
    expect(hookState.loading).toBe(true)

    // Unmount = cancellation
    act(() => {
      renderer.unmount()
    })

    // On résout la promesse après unmount avec un InvoiceApiResponse complet
    act(() => {
      resolveFn({
        status: 200,
        data: {
          data: [{ id: 'X', amount: 0 }] as any,
          meta: {
            total: 1,
            per_page: 10,
            current_page: 1,
            last_page: 1,
          },
          links: {} as any,
        },
      })
    })
    // flush
    await act(async () => await Promise.resolve())

    // Aucune mise à jour après fetch ne doit avoir eu lieu
    expect(hookState.invoices).toEqual([])
    expect(hookState.total).toBe(0)
    // loading reste true car on n'est jamais entré dans le finally (cancelled = true)
    expect(hookState.loading).toBe(true)
    expect(hookState.error).toBeNull()
    expect(hookState.validationErrors).toBeNull()
  })

  it('500 error → sets Unknown error', async () => {
    // Erreur “plain object” avec status non-422
    const plainErr = { response: { status: 500 } }
    vi.spyOn(billingService, 'getInvoices').mockRejectedValue(plainErr)

    const { result } = renderHook(() => useInvoices(dummyFilters, 'en'))
    await act(async () => await Promise.resolve())

    // err instanceof Error → false, on doit avoir new Error('Unknown error')
    const errState = result().error
    expect(errState).toBeInstanceOf(Error)
    expect(errState?.message).toBe('Unknown error')
    expect(result().loading).toBe(false)
    expect(result().validationErrors).toBeNull()
    expect(result().invoices).toEqual([])
    expect(result().total).toBe(0)
  })

  it('cancellation in catch empêche setError après unmount', async () => {
    // Promise manuelle pour rejeter plus tard
    let rejectFn!: (e: any) => void
    const pending = new Promise<InvoiceApiResponse>((_res, rej) => {
      rejectFn = rej
    })
    vi.spyOn(billingService, 'getInvoices').mockReturnValue(pending as any)

    let hookState!: ReturnType<typeof useInvoices>
    function HookWrapper({ filters, lang }: { filters: InvoiceFilters; lang: string }) {
      hookState = useInvoices(filters, lang)
      return null
    }

    // Mount puis unmount
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<HookWrapper filters={dummyFilters} lang="en" />)
    })
    expect(hookState.loading).toBe(true)
    act(() => {
      renderer.unmount()
    })

    // On rejette après l’unmount
    act(() => {
      rejectFn(new Error('fail'))
    })
    await act(async () => await Promise.resolve())

    // error doit rester null car cancelation court-circuite le catch
    expect(hookState.error).toBeNull()
    // loading reste true (finally non exécuté)
    expect(hookState.loading).toBe(true)
    expect(hookState.invoices).toEqual([])
    expect(hookState.total).toBe(0)
    expect(hookState.validationErrors).toBeNull()
  })
})
