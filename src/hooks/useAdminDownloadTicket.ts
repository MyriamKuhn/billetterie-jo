import { useAuthStore } from '../stores/useAuthStore'
import { getAdminTicketPdf } from '../services/billingService'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCustomSnackbar } from '../hooks/useCustomSnackbar'
import { logError } from '../utils/logger'

/**
 * Hook to download a ticket PDF as an admin user.
 *
 * Handles authentication check, download state, and error notifications.
 */
export function useAdminDownloadTicket() {
  const token = useAuthStore(s => s.authToken)
  const { t } = useTranslation('orders')
  const { notify } = useCustomSnackbar()

  // Local state to track whether a download is in progress
  const [downloading, setDownloading] = useState(false)

  /**
   * Downloads the ticket PDF given its raw filename.
   * - Verifies authentication.
   * - Strips any path segments from the raw filename.
   * - Fetches the blob, creates an object URL, and triggers browser download.
   * - Sends success or error notifications based on outcome.
   *
   * @param rawPdfFilename Full filename or path of the PDF to download
   */
  const download = async (rawPdfFilename: string) => {
    // Ensure the user is authenticated
    if (!token) {
      notify(t('errors.not_authenticated'), 'warning')
      return
    }

    // Extract just the filename portion
    const filename = rawPdfFilename.replace(/^.*[\\/]/, '')
    if (!filename) {
      notify(t('errors.download_failed'), 'error')
      return
    }
    setDownloading(true)
    try {
      // Fetch the ticket PDF blob
      const blob = await getAdminTicketPdf(filename, token)

      // Create an object URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(blobUrl)
      notify(t('tickets.download_success'), 'success')
    } catch (err: any) {
      // Log for debugging
      logError('useDownloadTicket', err)

      // Determine notification message and severity
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
