import { useAuthStore } from '../stores/useAuthStore'
import { getUserInvoice } from '../services/billingService'
import { useState } from 'react'
import { useCustomSnackbar } from '../hooks/useCustomSnackbar'
import { useTranslation } from 'react-i18next'
import { logError } from '../utils/logger'

/**
 * Custom hook to download a user invoice PDF.
 *
 * Manages download state, handles authentication,
 * creates a blob URL and triggers the browser download,
 * and displays notifications on success or failure.
 *
 * @returns An object containing:
 *   - download: async function to initiate invoice download.
 *   - downloading: boolean flag indicating download in progress.
 */
export function useDownloadInvoice() {
  const token = useAuthStore(s => s.authToken)
  const { t } = useTranslation('invoices')
  const { notify } = useCustomSnackbar()

  // Local state for download progress
  const [downloading, setDownloading] = useState(false)

  /**
   * Download the invoice PDF corresponding to invoice_link.
   *
   * @param invoice_link  The filename or path identifier for the invoice.
   */
  const download = async (invoice_link: string) => {
    // Require authentication
    if (!token) {
      notify(t('errors.not_authenticated'), 'warning')
      return
    }
    setDownloading(true)

    try {
      // Fetch blob from backend
      const blob = await getUserInvoice(invoice_link, token)
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = invoice_link
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(blobUrl)
      // Notify success
      notify(t('card.download_success'), 'success')
    } catch (err: any) {
      // Log internal error
      logError('useDownloadInvoice', err)
      // Determine user-facing message and severity
      let msg = t('errors.download_failed')
      let severity: 'error' | 'warning' = 'error'
      if (err.response?.status === 404) {
        msg = t('errors.not_found')
        severity = 'warning'
      } else if (err.response?.status === 401) {
        msg = t('errors.unauthorized')
        severity = 'warning'
      }
      notify(msg, severity)
    } finally {
      setDownloading(false)
    }
  }

  return { download, downloading }
}
