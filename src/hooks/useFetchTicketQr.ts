import { useState, useEffect } from 'react'
import { getUserQr } from '../services/billingService'
import { useAuthStore } from '../stores/useAuthStore'
import { useCustomSnackbar } from './useCustomSnackbar'
import { useTranslation } from 'react-i18next'
import { logError } from '../utils/logger'

/**
 * Hook to fetch a ticket QR code as a Blob URL.
 *
 * @param qrFilename - The filename of the QR code blob, or null to skip.
 * @returns An object containing:
 *   - qrUrl: the object URL for the fetched QR Blob, or null.
 *   - loading: boolean indicating fetch in progress.
 */
export function useFetchTicketQr(qrFilename: string | null) {
  const token = useAuthStore(s => s.authToken)
  const { notify } = useCustomSnackbar()
  const { t } = useTranslation('tickets')
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let canceled = false
    // Clean up previous URL if present
    if (qrUrl) {
      URL.revokeObjectURL(qrUrl)
      setQrUrl(null)
    }
    // If no filename provided, do nothing
    if (!qrFilename) {
      return
    }
    // Require authentication
    if (!token) {
      notify(t('errors.not_authenticated'), 'warning')
      return
    }

    // Strip any path components
    const filename = qrFilename.replace(/^.*[\\/]/, '')

    const fetchQr = async () => {
      setLoading(true)
      try {
        // Request the QR code blob
        const blob = await getUserQr(filename, token)
        if (canceled) return
        // Create an object URL for the blob
        const url = URL.createObjectURL(blob)
        setQrUrl(url)
      } catch (err: any) {
        // Log and notify on error
        logError('useFetchTicketQr', err)
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
    // Cleanup on unmount or filename change
    return () => {
      canceled = true
    }
  }, [qrFilename, token])

  return { qrUrl, loading }
}
