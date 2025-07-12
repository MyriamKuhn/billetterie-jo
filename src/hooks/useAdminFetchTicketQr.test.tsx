import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminFetchTicketQr } from './useAdminFetchTicketQr'
import * as authStore from '../stores/useAuthStore'
import * as billingService from '../services/billingService'
import * as customSnackbar from '../hooks/useCustomSnackbar'
import * as i18n from 'react-i18next'
import * as logger from '../utils/logger'

// Mocks
vi.mock('../stores/useAuthStore')
vi.mock('../services/billingService')
vi.mock('../hooks/useCustomSnackbar')
vi.mock('react-i18next')
vi.mock('../utils/logger')

describe('useAdminFetchTicketQr', () => {
  const mockNotify = vi.fn()
  const mockGetQr = vi.spyOn(billingService, 'getAdminQr')
  const mockLogError = vi.spyOn(logger, 'logError')

  function TestComp({ qrFilename }: { qrFilename: string | null }) {
    const { qrUrl, loading } = useAdminFetchTicketQr(qrFilename)
    return (
      <>
        <span data-testid="qrUrl">{qrUrl ?? 'null'}</span>
        <span data-testid="loading">{loading.toString()}</span>
      </>
    )
  }

  beforeEach(() => {
    vi.resetAllMocks()
    // AuthStore default with valid token
    vi.spyOn(authStore, 'useAuthStore').mockImplementation(selector =>
      selector({ authToken: 'token123', role: 'user', remember: false, setToken() {}, clearToken() {} } as any)
    )
    // Snackbar
    vi.spyOn(customSnackbar, 'useCustomSnackbar').mockReturnValue({ notify: mockNotify })
    // i18n
    vi.spyOn(i18n, 'useTranslation').mockReturnValue({ t: (key: string) => key } as any)
    // URL mocks
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:qr')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('does nothing when qrFilename is null', () => {
    render(<TestComp qrFilename={null} />)
    expect(screen.getByTestId('qrUrl')).toHaveTextContent('null')
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(mockGetQr).not.toHaveBeenCalled()
  })

  it('notifies when no token', async () => {
    vi.spyOn(authStore, 'useAuthStore').mockImplementation(selector =>
      selector({ authToken: '', role: 'user', remember: false, setToken() {}, clearToken() {} } as any)
    )
    render(<TestComp qrFilename="qr.png" />)
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('errors.not_authenticated', 'warning')
    })
    expect(screen.getByTestId('qrUrl')).toHaveTextContent('null')
  })

  it('fetches and sets qrUrl on success', async () => {
    const blob = new Blob(['x'], { type: 'image/png' })
    mockGetQr.mockResolvedValueOnce(blob)

    render(<TestComp qrFilename="path/qr.png" />)
    expect(screen.getByTestId('loading')).toHaveTextContent('true')

    await waitFor(() => {
      expect(mockGetQr).toHaveBeenCalledWith('qr.png', 'token123')
      expect(screen.getByTestId('qrUrl')).toHaveTextContent('blob:qr')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })

  it('handles generic error', async () => {
    const err = new Error('fail')
    mockGetQr.mockRejectedValueOnce(err)

    render(<TestComp qrFilename="qr.png" />)
    await waitFor(() => {
      expect(mockLogError).toHaveBeenCalledWith('useAdminFetchTicketQr', err)
      expect(mockNotify).toHaveBeenCalledWith('errors.qr_fetch_failed', 'error')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })

  it('handles 404 error', async () => {
    const err: any = new Error('not found')
    err.response = { status: 404 }
    mockGetQr.mockRejectedValueOnce(err)

    render(<TestComp qrFilename="qr.png" />)
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('errors.qr_not_found', 'error')
    })
  })

  it('handles 401 error', async () => {
    const err: any = new Error('unauth')
    err.response = { status: 401 }
    mockGetQr.mockRejectedValueOnce(err)

    render(<TestComp qrFilename="qr.png" />)
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('errors.unauthorized', 'error')
    })
  })

  it('revokes previous URL when filename changes', async () => {
    const blob1 = new Blob(['1'], { type: 'image/png' })
    const blob2 = new Blob(['2'], { type: 'image/png' })
    mockGetQr.mockResolvedValueOnce(blob1).mockResolvedValueOnce(blob2)

    const { rerender } = render(<TestComp qrFilename="a.png" />)
    await waitFor(() => expect(screen.getByTestId('qrUrl')).toHaveTextContent('blob:qr'))
    rerender(<TestComp qrFilename="b.png" />)
    await waitFor(() => {
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:qr')
      expect(mockGetQr).toHaveBeenCalledWith('b.png', 'token123')
    })
  })

  it('does not update after unmount (canceled branch)', async () => {
    let resolveBlob: (b: Blob) => void
    const deferred = new Promise<Blob>(res => { resolveBlob = res })
    mockGetQr.mockReturnValueOnce(deferred)

    const { unmount } = render(<TestComp qrFilename="delayed.png" />)
    unmount()

    await act(async () => {
      resolveBlob(new Blob(['x'], { type: 'image/png' }))
      await deferred
    })

    expect(global.URL.createObjectURL).not.toHaveBeenCalled()
    expect(mockNotify).not.toHaveBeenCalled()
  })
})

