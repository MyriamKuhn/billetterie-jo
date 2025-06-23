import TestRenderer, { act } from 'react-test-renderer'
import { vi, type Mock } from 'vitest'
import { renderHook } from '../tests/test-utils'

import { useFetchTicketQr } from './useFetchTicketQr'
import * as authStore from '../stores/useAuthStore'
import * as billingService from '../services/billingService'
import * as snackbarHook from '../hooks/useCustomSnackbar'
import * as logger from '../utils/logger'
import { useTranslation } from 'react-i18next'

// mock complet de react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}))

describe('useFetchTicketQr', () => {
  let notifyMock: ReturnType<typeof vi.fn>
  const baseAuthState = {
    authToken: 'TKN',
    role: null as null,
    remember: false,
    setToken: vi.fn(),
    clearToken: vi.fn(),
  }

  beforeEach(() => {
    vi.spyOn(authStore, 'useAuthStore')
      .mockImplementation((sel) => sel(baseAuthState))

    notifyMock = vi.fn()
    vi.spyOn(snackbarHook, 'useCustomSnackbar')
      .mockReturnValue({ notify: notifyMock })

    vi.spyOn(logger, 'logError').mockImplementation(() => {})

    ;(window.URL as any).createObjectURL ??= vi.fn()
    ;(window.URL as any).revokeObjectURL ??= vi.fn()
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob://url')
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {})

    ;(useTranslation as Mock).mockReturnValue({
      t: (key: string) => `<${key}>`,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initial state when qrFilename is null', () => {
    const { result } = renderHook(() => useFetchTicketQr(null))
    expect(result().qrUrl).toBeNull()
    expect(result().loading).toBe(false)
    expect(notifyMock).not.toHaveBeenCalled()
  })

  it('early return when qrFilename is empty string', async () => {
    const { result } = renderHook(() => useFetchTicketQr(''))
    await act(async () => await Promise.resolve())
    expect(result().qrUrl).toBeNull()
    expect(result().loading).toBe(false)
    expect(notifyMock).not.toHaveBeenCalled()
  })

  it('not authenticated → warning and no fetch', async () => {
    const noAuthState = { ...baseAuthState, authToken: null }
    vi.spyOn(authStore, 'useAuthStore')
      .mockImplementation((sel) => sel(noAuthState))

    const { result } = renderHook(() => useFetchTicketQr('ticket.png'))
    await act(async () => await Promise.resolve())

    expect(notifyMock).toHaveBeenCalledWith(
      '<errors.not_authenticated>',
      'warning'
    )
    expect(result().qrUrl).toBeNull()
    expect(result().loading).toBe(false)
  })

  it('successful fetch → sets qrUrl and loading false', async () => {
    const fakeBlob = new Blob(['data'], { type: 'image/png' })
    vi.spyOn(billingService, 'getUserQr').mockResolvedValue(fakeBlob)

    const { result } = renderHook(() => useFetchTicketQr('path/to/ticket.png'))
    await act(async () => await Promise.resolve())

    expect(window.URL.createObjectURL).toHaveBeenCalledWith(fakeBlob)
    expect(result().qrUrl).toBe('blob://url')
    expect(result().loading).toBe(false)
  })

  it('404 error → logError + notify qr_not_found', async () => {
    const err = { response: { status: 404 } }
    vi.spyOn(billingService, 'getUserQr').mockRejectedValue(err)

    const { result } = renderHook(() => useFetchTicketQr('ticket.png'))
    await act(async () => await Promise.resolve())

    expect(logger.logError).toHaveBeenCalledWith('useFetchTicketQr', err)
    expect(notifyMock).toHaveBeenCalledWith(
      '<errors.qr_not_found>',
      'error'
    )
    expect(result().qrUrl).toBeNull()
    expect(result().loading).toBe(false)
  })

  it('401 error → logError + notify unauthorized', async () => {
    const err = { response: { status: 401 } }
    vi.spyOn(billingService, 'getUserQr').mockRejectedValue(err)

    const { result } = renderHook(() => useFetchTicketQr('ticket.png'))
    await act(async () => await Promise.resolve())

    expect(logger.logError).toHaveBeenCalledWith('useFetchTicketQr', err)
    expect(notifyMock).toHaveBeenCalledWith(
      '<errors.unauthorized>',
      'error'
    )
    expect(result().qrUrl).toBeNull()
    expect(result().loading).toBe(false)
  })

  it('generic error → logError + notify qr_fetch_failed', async () => {
    const err = new Error('network')
    vi.spyOn(billingService, 'getUserQr').mockRejectedValue(err)

    const { result } = renderHook(() => useFetchTicketQr('ticket.png'))
    await act(async () => await Promise.resolve())

    expect(logger.logError).toHaveBeenCalledWith('useFetchTicketQr', err)
    expect(notifyMock).toHaveBeenCalledWith(
      '<errors.qr_fetch_failed>',
      'error'
    )
    expect(result().qrUrl).toBeNull()
    expect(result().loading).toBe(false)
  })

  it('revoke previous URL and reset qrUrl when filename changes', async () => {
    let hookReturn!: ReturnType<typeof useFetchTicketQr>
    function Hook({ filename }: { filename: string | null }) {
      hookReturn = useFetchTicketQr(filename)
      return null
    }

    const fakeBlob = new Blob(['x'], { type: 'image/png' })
    vi.spyOn(billingService, 'getUserQr').mockResolvedValue(fakeBlob)

    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<Hook filename="one.png" />)
    })
    await act(async () => await Promise.resolve())

    expect(hookReturn.qrUrl).toBe('blob://url')
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1)

    act(() => {
      renderer.update(<Hook filename="two.png" />)
    })
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob://url')
    expect(hookReturn.qrUrl).toBeNull()

    await act(async () => await Promise.resolve())
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(2)
    expect(hookReturn.qrUrl).toBe('blob://url')
  })

  it('does not create URL when unmounted before fetch resolves (canceled)', async () => {
    let hookReturn!: ReturnType<typeof useFetchTicketQr>
    function Hook({ filename }: { filename: string | null }) {
      hookReturn = useFetchTicketQr(filename)
      return null
    }

    let resolveBlob!: (b: Blob) => void
    const pending = new Promise<Blob>(resolve => {
      resolveBlob = resolve
    })
    vi.spyOn(billingService, 'getUserQr').mockReturnValue(pending as any)

    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<Hook filename="ticket.png" />)
    })

    expect(hookReturn.loading).toBe(true)

    act(() => {
      renderer.unmount()
    })

    act(() => {
      resolveBlob(new Blob(['x'], { type: 'image/png' }))
    })
    await act(async () => await Promise.resolve())

    expect(window.URL.createObjectURL).not.toHaveBeenCalled()
  })
})
