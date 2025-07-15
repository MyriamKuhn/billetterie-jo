import { useAuthStore } from '../stores/useAuthStore'
import { getAdminInvoice } from '../services/billingService'
import { useState } from 'react'
import { useCustomSnackbar } from '../hooks/useCustomSnackbar'
import { useTranslation } from 'react-i18next'
import { logError } from '../utils/logger'

/**
 * Hook to download an invoice as an admin user.
 *
 * Manages authentication check, download state, and user notifications.
 */
export function useAdminDownloadInvoice() {
  const token = useAuthStore(s => s.authToken)
  const { t } = useTranslation('orders')
  const { notify } = useCustomSnackbar()

  // Local state to track download in progress
  const [downloading, setDownloading] = useState(false)

  /**
   * Downloads the invoice PDF given its link identifier.
   * - If not authenticated, warns the user.
   * - Otherwise, fetches the blob, creates a temporary link,
   *   triggers browser download, and revokes the blob URL.
   * - Notifies the user on success or handles various error cases.
   *
   * @param invoice_link Identifier or filename of the invoice to download
   */
  const download = async (invoice_link: string) => {
    // Ensure the user is authenticated
    if (!token) {
      notify(t('errors.not_authenticated'), 'warning')
      return
    }
    setDownloading(true)

    try {
      // Fetch the invoice as a Blob
      const blob = await getAdminInvoice(invoice_link, token)
      
      // Create an object URL for the blob and trigger the download
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = invoice_link
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(blobUrl)
      notify(t('tickets.download_success'), 'success')
    } catch (err: any) {
      // Log the error for debugging
      logError('useAdminDownloadInvoice', err)

      // Determine user-facing message and severity based on HTTP status
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