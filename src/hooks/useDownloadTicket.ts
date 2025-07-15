import { useAuthStore } from '../stores/useAuthStore'
import { getUserTicketPdf } from '../services/billingService'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCustomSnackbar } from '../hooks/useCustomSnackbar'
import { logError } from '../utils/logger'

/**
 * Hook to download a user ticket PDF.
 *
 * Handles authentication check, fetches the ticket blob,
 * creates a temporary URL to trigger browser download,
 * and displays notifications on success or failure.
 *
 * @returns An object with:
 *   - download: async function to start the download.
 *   - downloading: boolean flag indicating if download is in progress.
 */
export function useDownloadTicket() {
  const token = useAuthStore(s => s.authToken)
  const { t } = useTranslation('tickets')
  const { notify } = useCustomSnackbar()

  // Local state for download status
  const [downloading, setDownloading] = useState(false)

  /**
   * Initiate download of the ticket PDF.
   *
   * @param rawPdfFilename  The full path or filename returned by the API.
   */
  const download = async (rawPdfFilename: string) => {
    // Ensure the user is authenticated
    if (!token) {
      notify(t('errors.not_authenticated'), 'warning')
      return
    }
    // Extract filename from any path
    const filename = rawPdfFilename.replace(/^.*[\\/]/, '')
    if (!filename) {
      notify(t('errors.download_failed'), 'error')
      return
    }

    setDownloading(true)

    try {
      // Fetch the PDF blob from the server
      const blob = await getUserTicketPdf(filename, token)

      // Create a URL for the blob and trigger download
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(blobUrl)
      // Show success notification
      notify(t('tickets.download_success'), 'success')
    } catch (err: any) {
      // Log internal error for debugging
      logError('useDownloadTicket', err)

      // Determine user-facing error message and severity
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
