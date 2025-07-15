import { useState, useEffect } from 'react'
import { getAdminQr } from '../services/billingService'
import { useAuthStore } from '../stores/useAuthStore'
import { useCustomSnackbar } from './useCustomSnackbar'
import { useTranslation } from 'react-i18next'
import { logError } from '../utils/logger'

/**
 * Hook to fetch a ticket QR code blob URL for admin users.
 *
 * - Re-fetches when `qrFilename` changes.
 * - Revokes any previous object URL to avoid memory leaks.
 * - Handles authentication, loading state, and error notifications.
 *
 * @param qrFilename Filename or path of the QR image to fetch; if null, does nothing.
 * @returns { qrUrl: string | null, loading: boolean }
 */
export function useAdminFetchTicketQr(qrFilename: string | null) {
  const token = useAuthStore(s => s.authToken)
  const { notify } = useCustomSnackbar()
  const { t } = useTranslation('orders')
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let canceled = false
    // Clean up any previous QR URL
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

    // Extract just the filename
    const filename = qrFilename.replace(/^.*[\\/]/, '')

    const fetchQr = async () => {
      setLoading(true)
      try {
        // Fetch the QR blob
        const blob = await getAdminQr(filename, token)
        if (canceled) return
        // Create object URL and store it
        const url = URL.createObjectURL(blob)
        setQrUrl(url)
      } catch (err: any) {
        logError('useAdminFetchTicketQr', err)
        // Determine error message
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
