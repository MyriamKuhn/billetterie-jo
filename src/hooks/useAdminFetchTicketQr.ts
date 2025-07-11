import { useState, useEffect } from 'react'
import { getAdminQr } from '../services/billingService'
import { useAuthStore } from '../stores/useAuthStore'
import { useCustomSnackbar } from './useCustomSnackbar'
import { useTranslation } from 'react-i18next'
import { logError } from '../utils/logger'

export function useAdminFetchTicketQr(qrFilename: string | null) {
  const token = useAuthStore(s => s.authToken)
  const { notify } = useCustomSnackbar()
  const { t } = useTranslation('orders')
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let canceled = false
    // Nettoyage de l’URL précédente
    if (qrUrl) {
      URL.revokeObjectURL(qrUrl)
      setQrUrl(null)
    }
    if (!qrFilename) {
      return
    }
    if (!token) {
      notify(t('errors.not_authenticated'), 'warning')
      return
    }

    const filename = qrFilename.replace(/^.*[\\/]/, '')

    const fetchQr = async () => {
      setLoading(true)
      try {
        const blob = await getAdminQr(filename, token)
        if (canceled) return
        const url = URL.createObjectURL(blob)
        setQrUrl(url)
      } catch (err: any) {
        logError('useAdminFetchTicketQr', err)
        let msg = t('errors.qr_fetch_failed')
        if (err.response?.status === 404) {
          msg = t('errors.qr_not_found')
        } else if (err.response?.status === 401) {
          msg = t('errors.unauthorized')
        }
        notify(msg, 'error')
      } finally {
        if (!canceled) setLoading(false)
      }
    }
    fetchQr()
    return () => {
      canceled = true
    }
  }, [qrFilename, token])

  return { qrUrl, loading }
}
