import { useAuthStore } from '../stores/useAuthStore'
import { getAdminInvoice } from '../services/billingService'
import { useState } from 'react'
import { useCustomSnackbar } from '../hooks/useCustomSnackbar'
import { useTranslation } from 'react-i18next'
import { logError } from '../utils/logger'

export function useAdminDownloadInvoice() {
  const token = useAuthStore(s => s.authToken)
  const { t } = useTranslation('orders')
  const { notify } = useCustomSnackbar()

  const [downloading, setDownloading] = useState(false)

  const download = async (invoice_link: string) => {
    if (!token) {
      notify(t('errors.not_authenticated'), 'warning')
      return
    }
    setDownloading(true)

    try {
      const blob = await getAdminInvoice(invoice_link, token)
      // Créer un URL pour le blob et déclencher le téléchargement
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      // Nom du fichier proposé : invoice_link ou autre nom
      a.download = invoice_link
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(blobUrl)
      notify(t('tickets.download_success'), 'success')
    } catch (err: any) {
      logError('useAdminDownloadInvoice', err)
      // On peut inspecter err.response?.status si c'est une erreur axios
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