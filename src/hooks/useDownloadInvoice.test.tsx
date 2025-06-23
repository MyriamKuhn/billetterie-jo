import { act } from 'react-test-renderer'
import { vi, type Mock } from 'vitest'
import { renderHook } from '../tests/test-utils'   // ajustez si besoin
import { useDownloadInvoice } from './useDownloadInvoice'

import * as authStore from '../stores/useAuthStore'
import * as billingService from '../services/billingService'
import * as snackbarHook from '../hooks/useCustomSnackbar'
import * as logger from '../utils/logger'
import { useTranslation } from 'react-i18next'

// Mock complet de react-i18next pour pouvoir reconfigurer useTranslation
vi.mock('react-i18next', () => ({ useTranslation: vi.fn() }))

describe('useDownloadInvoice (sans testing-library/hooks)', () => {
  let notifyMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // 1) mock de useAuthStore en mode Zustand : on reçoit un selector et on lui passe l'état
    vi
      .spyOn(authStore, 'useAuthStore')
      .mockImplementation((selector: (state: any) => any) =>
        selector({ authToken: 'TKN' })
      )

    // 2) mock useTranslation
    ;(useTranslation as Mock).mockReturnValue({
      t: (key: string) => `<${key}>`,
    })

    // 3) mock snackbar
    notifyMock = vi.fn()
    vi
      .spyOn(snackbarHook, 'useCustomSnackbar')
      .mockReturnValue({ notify: notifyMock })

    // 4) mock logger
    vi.spyOn(logger, 'logError').mockImplementation(() => {})

    // 5) définir et mocker window.URL
    ;(window.URL as any).createObjectURL ??= vi.fn()
    ;(window.URL as any).revokeObjectURL ??= vi.fn()
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob://url')
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {})

    // 6) mock appendChild
    vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node: Node) => node)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('notifie warning si pas de token', async () => {
    // Override pour retourner null
    vi
      .spyOn(authStore, 'useAuthStore')
      .mockImplementation((selector: (state: any) => any) =>
        selector({ authToken: null })
      )

    const { result } = renderHook(() => useDownloadInvoice())
    await act(async () => {
      await result().download('f.pdf')
    })

    expect(notifyMock).toHaveBeenCalledWith(
      '<errors.not_authenticated>',
      'warning'
    )
    expect(result().downloading).toBe(false)
  })

  it('download OK et notify success', async () => {
    const fakeBlob = new Blob([''], { type: 'application/pdf' })
    vi.spyOn(billingService, 'getUserInvoice').mockResolvedValue(fakeBlob)

    const { result } = renderHook(() => useDownloadInvoice())
    await act(async () => {
      await result().download('f.pdf')
    })

    expect(window.URL.createObjectURL).toHaveBeenCalledWith(fakeBlob)
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob://url')
    expect(notifyMock).toHaveBeenCalledWith(
      '<card.download_success>',
      'success'
    )
    expect(result().downloading).toBe(false)
  })

  it('404 → notify not_found warning', async () => {
    const err = { response: { status: 404 } }
    vi.spyOn(billingService, 'getUserInvoice').mockRejectedValue(err)

    const { result } = renderHook(() => useDownloadInvoice())
    await act(async () => {
      await result().download('f.pdf')
    })

    expect(logger.logError).toHaveBeenCalledWith(
      'useDownloadInvoice',
      err
    )
    expect(notifyMock).toHaveBeenCalledWith('<errors.not_found>', 'warning')
    expect(result().downloading).toBe(false)
  })

  it('401 → notify unauthorized warning', async () => {
    const err = { response: { status: 401 } }
    vi.spyOn(billingService, 'getUserInvoice').mockRejectedValue(err)

    const { result } = renderHook(() => useDownloadInvoice())
    await act(async () => {
      await result().download('f.pdf')
    })

    expect(notifyMock).toHaveBeenCalledWith(
      '<errors.unauthorized>',
      'warning'
    )
    expect(result().downloading).toBe(false)
  })

  it('autre erreur → notify download_failed error', async () => {
    const err = new Error('boom')
    vi.spyOn(billingService, 'getUserInvoice').mockRejectedValue(err)

    const { result } = renderHook(() => useDownloadInvoice())
    await act(async () => {
      await result().download('f.pdf')
    })

    expect(notifyMock).toHaveBeenCalledWith(
      '<errors.download_failed>',
      'error'
    )
    expect(result().downloading).toBe(false)
  })
})
