import TestRenderer, { act } from 'react-test-renderer'
import { vi } from 'vitest'
import { renderHook } from '../tests/test-utils'
import { useTickets } from './useTickets'
import * as authStore from '../stores/useAuthStore'
import * as billingService from '../services/billingService'
import type { Ticket, TicketsApiResponse, TicketFilters } from '../types/tickets'

describe('useTickets', () => {
  // état AuthStore minimal
  const baseAuthState = {
    authToken: 'TKN',
    role: null as null,
    remember: false,
    setToken: vi.fn(),
    clearToken: vi.fn(),
  }
  // filters dummy, on force le cast pour TS
  const dummyFilters = {} as unknown as TicketFilters

  beforeEach(() => {
    // mock Authentication
    vi
      .spyOn(authStore, 'useAuthStore')
      .mockImplementation(selector => selector(baseAuthState))

    // jsdom ne fournit pas URL.createObjectURL/revokeObjectURL
    ;(window.URL as any).createObjectURL ??= vi.fn()
    ;(window.URL as any).revokeObjectURL ??= vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('〈no token〉 renvoie erreur “User not authenticated”', () => {
    // override pour pas de token
    vi
      .spyOn(authStore, 'useAuthStore')
      .mockImplementation(selector =>
        selector({ ...baseAuthState, authToken: null })
      )

    const { result } = renderHook(() => useTickets(dummyFilters))
    const state = result()

    expect(state.error).toEqual(new Error('User not authenticated'))
    expect(state.tickets).toEqual([])
    expect(state.total).toBe(0)
    expect(state.loading).toBe(false)
    expect(state.validationErrors).toBeNull()
  })

  it('〈succès avec meta.total〉 met à jour tickets, total et loading', async () => {
    const fake: Ticket[] = [{ id: '1' } as any]
    // on fournit un TicketsApiResponse complet
    const resp = {
      data: {
        data: fake,
        meta: { total: 5 } as any,
      },
    } as unknown as TicketsApiResponse

    vi.spyOn(billingService, 'getUserTickets').mockResolvedValue(resp)

    const { result } = renderHook(() => useTickets(dummyFilters))
    // loading passe à true immédiatement
    expect(result().loading).toBe(true)

    // on attend la fin du micro-task
    await act(async () => {})

    const state = result()
    expect(state.loading).toBe(false)
    expect(state.tickets).toEqual(fake)
    expect(state.total).toBe(5)
    expect(state.error).toBeNull()
    expect(state.validationErrors).toBeNull()
  })

  it('〈succès sans meta.total〉 total ← length des données', async () => {
    const fake: Ticket[] = [{ id: 'A' } as any, { id: 'B' } as any]
    // meta sans total
    const resp = {
      data: {
        data: fake,
        meta: {} as any,
      },
    } as unknown as TicketsApiResponse

    vi.spyOn(billingService, 'getUserTickets').mockResolvedValue(resp)

    const { result } = renderHook(() => useTickets(dummyFilters))
    await act(async () => {})

    expect(result().tickets).toEqual(fake)
    expect(result().total).toBe(fake.length)
    expect(result().loading).toBe(false)
  })

  it('〈422 validation error〉 setValidationErrors', async () => {
    const errs = { field: 'required' }
    const errorObj = { response: { status: 422, data: { errors: errs } } }
    vi.spyOn(billingService, 'getUserTickets').mockRejectedValue(errorObj)

    const { result } = renderHook(() => useTickets(dummyFilters))
    await act(async () => {})

    expect(result().validationErrors).toEqual(errs)
    expect(result().error).toBeNull()
    expect(result().tickets).toEqual([])
    expect(result().total).toBe(0)
    expect(result().loading).toBe(false)
  })

  it('〈non-Error générique〉 new Error("Unknown error")', async () => {
    const errorObj = { response: { status: 500 } }
    vi.spyOn(billingService, 'getUserTickets').mockRejectedValue(errorObj)

    const { result } = renderHook(() => useTickets(dummyFilters))
    await act(async () => {})

    const err = result().error!
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Unknown error')
    expect(result().validationErrors).toBeNull()
  })

  it('〈Error instance〉 error ← instance reçue', async () => {
    const errorInstance = new Error('fail')
    vi.spyOn(billingService, 'getUserTickets').mockRejectedValue(errorInstance)

    const { result } = renderHook(() => useTickets(dummyFilters))
    await act(async () => {})

    expect(result().error).toBe(errorInstance)
  })

  it('〈cancellation success〉 pas de mise à jour après unmount', async () => {
    // promise en attente
    let resolveFn!: (r: TicketsApiResponse) => void
    const pending = new Promise<TicketsApiResponse>(resolve => {
      resolveFn = resolve
    })
    vi.spyOn(billingService, 'getUserTickets').mockReturnValue(pending as any)

    let hookState!: ReturnType<typeof useTickets>
    function Hook() {
      hookState = useTickets(dummyFilters)
      return null
    }

    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<Hook />)
    })
    expect(hookState.loading).toBe(true)

    act(() => {
      renderer.unmount()
    })

    act(() => {
      resolveFn({
        data: {
          data: [{ id: 'X' } as any],
          meta: { total: 1 } as any,
        },
      } as unknown as TicketsApiResponse)
    })
    await act(async () => {})

    // rien n'a bougé
    expect(hookState.tickets).toEqual([])
    expect(hookState.total).toBe(0)
    expect(hookState.loading).toBe(true)
    expect(hookState.error).toBeNull()
    expect(hookState.validationErrors).toBeNull()
  })

  it('〈cancellation error〉 pas d’erreur après unmount', async () => {
    let rejectFn!: (e: any) => void
    const pending = new Promise<TicketsApiResponse>((_, rej) => {
      rejectFn = rej
    })
    vi.spyOn(billingService, 'getUserTickets').mockReturnValue(pending as any)

    let hookState!: ReturnType<typeof useTickets>
    function Hook() {
      hookState = useTickets(dummyFilters)
      return null
    }

    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<Hook />)
    })
    expect(hookState.loading).toBe(true)

    act(() => {
      renderer.unmount()
    })

    act(() => {
      rejectFn(new Error('oops'))
    })
    await act(async () => {})

    expect(hookState.error).toBeNull()
    expect(hookState.loading).toBe(true)
  })
})
