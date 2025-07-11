import { useAuthStore } from '../stores/useAuthStore'
import { getAdminTicketPdf } from '../services/billingService'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCustomSnackbar } from '../hooks/useCustomSnackbar'
import { logError } from '../utils/logger'

export function useAdminDownloadTicket() {
  const token = useAuthStore(s => s.authToken)
  const { t } = useTranslation('orders')
  const { notify } = useCustomSnackbar()
  const [downloading, setDownloading] = useState(false)

  const download = async (rawPdfFilename: string) => {
    if (!token) {
      notify(t('errors.not_authenticated'), 'warning')
      return
    }
    const filename = rawPdfFilename.replace(/^.*[\\/]/, '')
    if (!filename) {
      notify(t('errors.download_failed'), 'error')
      return
    }
    setDownloading(true)
    try {
      const blob = await getAdminTicketPdf(filename, token)
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
      logError('useDownloadTicket', err)
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
