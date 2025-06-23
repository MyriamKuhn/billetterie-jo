import { act } from 'react-test-renderer'
import { vi, type Mock } from 'vitest'
import { renderHook } from '../tests/test-utils'   // ajustez le chemin si besoin
import { useDownloadTicket } from './useDownloadTicket'

import * as authStore from '../stores/useAuthStore'
import * as billingService from '../services/billingService'
import * as snackbarHook from '../hooks/useCustomSnackbar'
import * as logger from '../utils/logger'
import { useTranslation } from 'react-i18next'

// On mocke entièrement react-i18next pour piloter useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}))

describe('useDownloadTicket', () => {
  let notifyMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // 1) mock de useAuthStore (signature Zustand)
    vi
      .spyOn(authStore, 'useAuthStore')
      .mockImplementation((selector: (s: any) => any) =>
        selector({ authToken: 'TKN' })
      )

    // 2) mock de useTranslation
    ;(useTranslation as Mock).mockReturnValue({
      t: (key: string) => `<${key}>`,
    })

    // 3) mock de useCustomSnackbar
    notifyMock = vi.fn()
    vi
      .spyOn(snackbarHook, 'useCustomSnackbar')
      .mockReturnValue({ notify: notifyMock })

    // 4) mock du logger
    vi.spyOn(logger, 'logError').mockImplementation(() => {})

    // 5) s'assurer que URL.createObjectURL et revoke existent puis les spyOn
    ;(window.URL as any).createObjectURL ??= vi.fn()
    ;(window.URL as any).revokeObjectURL ??= vi.fn()
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob://url')
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {})

    // 6) mock appendChild pour que ça ne plante pas
    vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node: Node) => node)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('notifie warning si pas de token', async () => {
    // override pour retourner null
    vi
      .spyOn(authStore, 'useAuthStore')
      .mockImplementation((selector: (s: any) => any) =>
        selector({ authToken: null })
      )

    const { result } = renderHook(() => useDownloadTicket())

    await act(async () => {
      await result().download('ticket.pdf')
    })

    expect(notifyMock).toHaveBeenCalledWith(
      '<errors.not_authenticated>',
      'warning'
    )
    expect(result().downloading).toBe(false)
    expect(window.URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('notifie error si filename invalide (string vide après strip)', async () => {
    const { result } = renderHook(() => useDownloadTicket())

    await act(async () => {
      await result().download('/chemin/sans/fichier/')
    })

    expect(notifyMock).toHaveBeenCalledWith(
      '<errors.download_failed>',
      'error'
    )
    expect(result().downloading).toBe(false)
    expect(window.URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('télécharge correctement et notifie success', async () => {
    const fakeBlob = new Blob(['data'], { type: 'application/pdf' })
    vi
      .spyOn(billingService, 'getUserTicketPdf')
      .mockResolvedValue(fakeBlob)

    const { result } = renderHook(() => useDownloadTicket())

    await act(async () => {
      await result().download('mes/tickets/billet.pdf')
    })

    expect(window.URL.createObjectURL).toHaveBeenCalledWith(fakeBlob)
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob://url')
    expect(notifyMock).toHaveBeenCalledWith(
      '<tickets.download_success>',
      'success'
    )
    expect(result().downloading).toBe(false)
  })

  it('gère une erreur 404 et notifie not_found warning', async () => {
    const err = { response: { status: 404 } }
    vi
      .spyOn(billingService, 'getUserTicketPdf')
      .mockRejectedValue(err)

    const { result } = renderHook(() => useDownloadTicket())

    await act(async () => {
      await result().download('ticket.pdf')
    })

    expect(logger.logError).toHaveBeenCalledWith('useDownloadTicket', err)
    expect(notifyMock).toHaveBeenCalledWith(
      '<errors.not_found>',
      'warning'
    )
    expect(result().downloading).toBe(false)
  })

  it('gère une erreur 401 et notifie unauthorized warning', async () => {
    const err = { response: { status: 401 } }
    vi
      .spyOn(billingService, 'getUserTicketPdf')
      .mockRejectedValue(err)

    const { result } = renderHook(() => useDownloadTicket())

    await act(async () => {
      await result().download('ticket.pdf')
    })

    expect(notifyMock).toHaveBeenCalledWith(
      '<errors.unauthorized>',
      'warning'
    )
    expect(result().downloading).toBe(false)
  })

  it('gère une erreur générique et notifie download_failed error', async () => {
    const err = new Error('fail')
    vi
      .spyOn(billingService, 'getUserTicketPdf')
      .mockRejectedValue(err)

    const { result } = renderHook(() => useDownloadTicket())

    await act(async () => {
      await result().download('ticket.pdf')
    })

    expect(notifyMock).toHaveBeenCalledWith(
      '<errors.download_failed>',
      'error'
    )
    expect(result().downloading).toBe(false)
  })
})
