import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminDownloadInvoice } from './useAdminDownloadInvoice'
import * as authStore from '../stores/useAuthStore'
import * as billingService from '../services/billingService'
import * as logger from '../utils/logger'
import * as customSnackbar from '../hooks/useCustomSnackbar'
import * as i18n from 'react-i18next'

// Mock modules
vi.mock('../stores/useAuthStore')
vi.mock('../services/billingService')
vi.mock('../utils/logger')
vi.mock('../hooks/useCustomSnackbar')
vi.mock('react-i18next')

describe('useAdminDownloadInvoice', () => {
  const mockNotify = vi.fn()
  const mockGetAdminInvoice = vi.spyOn(billingService, 'getAdminInvoice')
  const mockLogError = vi.spyOn(logger, 'logError')

  // Helper component to use the hook
  function TestComp() {
    const { download, downloading } = useAdminDownloadInvoice()
    return (
      <>
        <span data-testid="downloading">{downloading.toString()}</span>
        <button onClick={() => download('invoice.pdf')}>Download</button>
      </>
    )
  }

  beforeEach(() => {
    vi.resetAllMocks()
    // Default signed-in user
    vi.spyOn(authStore, 'useAuthStore').mockImplementation(selector =>
      selector({
        authToken: 'token123',
        role: 'user',
        remember: false,
        setToken: () => {},
        clearToken: () => {},
      } as any)
    )
    // Translation mock
    vi.spyOn(i18n, 'useTranslation').mockReturnValue({
      t: (key: string, _opts?: any) => key
    } as any)
    // Snackbar mock
    vi.spyOn(customSnackbar, 'useCustomSnackbar').mockReturnValue({ notify: mockNotify })
    // Stub URL.createObjectURL/revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('notifies warning if no token', async () => {
    vi.spyOn(authStore, 'useAuthStore').mockImplementation(selector =>
      selector({
        authToken: '',
        role: 'user',
        remember: false,
        setToken: () => {},
        clearToken: () => {},
      } as any)
    )
    render(<TestComp />)
    fireEvent.click(screen.getByText('Download'))
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('errors.not_authenticated', 'warning')
    })
  })

  it('downloads invoice successfully', async () => {
    const fakeBlob = new Blob(['data'], { type: 'application/pdf' })
    mockGetAdminInvoice.mockResolvedValueOnce(fakeBlob)

    render(<TestComp />)
    fireEvent.click(screen.getByText('Download'))

    // downloading should switch to true
    expect(screen.getByTestId('downloading')).toHaveTextContent('true')

    await waitFor(() => {
      // Success notification
      expect(mockNotify).toHaveBeenCalledWith('tickets.download_success', 'success')
      // downloading should be reset to false
      expect(screen.getByTestId('downloading')).toHaveTextContent('false')
    })
  })

  it('handles generic error as download_failed', async () => {
    const err = new Error('fail')
    mockGetAdminInvoice.mockRejectedValueOnce(err)

    render(<TestComp />)
    fireEvent.click(screen.getByText('Download'))

    await waitFor(() => {
      expect(mockLogError).toHaveBeenCalledWith('useAdminDownloadInvoice', err)
      expect(mockNotify).toHaveBeenCalledWith('errors.download_failed', 'error')
    })
  })

  it('handles 404 error as not_found warning', async () => {
    const err: any = new Error('not found')
    err.response = { status: 404 }
    mockGetAdminInvoice.mockRejectedValueOnce(err)

    render(<TestComp />)
    fireEvent.click(screen.getByText('Download'))

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('errors.not_found', 'warning')
    })
  })

  it('handles 401 error as unauthorized warning', async () => {
    const err: any = new Error('unauth')
    err.response = { status: 401 }
    mockGetAdminInvoice.mockRejectedValueOnce(err)

    render(<TestComp />)
    fireEvent.click(screen.getByText('Download'))

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('errors.unauthorized', 'warning')
    })
  })
})
