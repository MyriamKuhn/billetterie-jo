import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminDownloadTicket } from './useAdminDownloadTicket'
import * as authStore from '../stores/useAuthStore'
import * as billingService from '../services/billingService'
import * as logger from '../utils/logger'
import * as customSnackbar from '../hooks/useCustomSnackbar'
import * as i18n from 'react-i18next'

// Mocks
vi.mock('../stores/useAuthStore')
vi.mock('../services/billingService')
vi.mock('../utils/logger')
vi.mock('../hooks/useCustomSnackbar')
vi.mock('react-i18next')

describe('useAdminDownloadTicket', () => {
  const mockNotify = vi.fn()
  const mockGetPdf = vi.spyOn(billingService, 'getAdminTicketPdf')
  const mockLogError = vi.spyOn(logger, 'logError')

  // Helper component to use the hook
  function TestComp() {
    const { download, downloading } = useAdminDownloadTicket()
    return (
      <>
        <span data-testid="downloading">{downloading.toString()}</span>
        <button onClick={() => download('path/to/file.pdf')}>Download</button>
      </>
    )
  }

  beforeEach(() => {
    vi.resetAllMocks()
    // AuthStore
    vi.spyOn(authStore, 'useAuthStore').mockImplementation(selector =>
      selector({
        authToken: 'token123',
        role: 'user',
        remember: false,
        setToken: () => {},
        clearToken: () => {},
      } as any)
    )
    // i18n
    vi.spyOn(i18n, 'useTranslation').mockReturnValue({ t: (key: string) => key } as any)
    // Snackbar
    vi.spyOn(customSnackbar, 'useCustomSnackbar').mockReturnValue({ notify: mockNotify })
    // URL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('warns when no token', async () => {
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

  it('warns when filename empty', async () => {
    // Composant spécifique pour tester filename empty
    function EmptyComp() {
      const { download } = useAdminDownloadTicket()
      return <button onClick={() => download('')}>Empty</button>
    }
    render(<EmptyComp />)
    fireEvent.click(screen.getByText('Empty'))
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('errors.download_failed', 'error')
    })
  })

  it('downloads successfully', async () => {
    const fakeBlob = new Blob(['pdf'], { type: 'application/pdf' })
    mockGetPdf.mockResolvedValueOnce(fakeBlob)
    render(<TestComp />)
    fireEvent.click(screen.getByText('Download'))
    expect(screen.getByTestId('downloading')).toHaveTextContent('true')
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('tickets.download_success', 'success')
      expect(screen.getByTestId('downloading')).toHaveTextContent('false')
    })
  })

  it('handles generic error', async () => {
    const err = new Error('fail')
    mockGetPdf.mockRejectedValueOnce(err)
    render(<TestComp />)
    fireEvent.click(screen.getByText('Download'))
    await waitFor(() => {
      expect(mockLogError).toHaveBeenCalledWith('useDownloadTicket', err)
      expect(mockNotify).toHaveBeenCalledWith('errors.download_failed', 'error')
    })
  })

  it('handles 404 error', async () => {
    const err: any = new Error('not found')
    err.response = { status: 404 }
    mockGetPdf.mockRejectedValueOnce(err)
    render(<TestComp />)
    fireEvent.click(screen.getByText('Download'))
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('errors.not_found', 'warning')
    })
  })

  it('handles 401 error', async () => {
    const err: any = new Error('unauth')
    err.response = { status: 401 }
    mockGetPdf.mockRejectedValueOnce(err)
    render(<TestComp />)
    fireEvent.click(screen.getByText('Download'))
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('errors.unauthorized', 'warning')
    })
  })
})
