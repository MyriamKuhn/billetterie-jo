import { useState, useEffect } from 'react'
import type { Invoice, InvoiceApiResponse, InvoiceFilters } from '../types/invoices'
import { getInvoices } from '../services/billingService'
import { useAuthStore } from '../stores/useAuthStore'

/**
 * Hook to fetch user invoices with filtering, pagination and error handling.
 *
 * @param filters - Filtering and pagination options.
 * @param lang - Language code for Accept-Language header (if needed).
 * @returns An object containing:
 *   - invoices: the fetched list of invoices
 *   - total: total number of invoices matching the filters
 *   - loading: whether the request is in progress
 *   - error: a general Error if the request failed (excluding validation errors)
 *   - validationErrors: errors returned by a 422 response, if any
 */
export function useInvoices(filters: InvoiceFilters, lang: string) {
  const token = useAuthStore(s => s.authToken)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [validationErrors, setValidationErrors] = useState<any>(null)

  useEffect(() => {
    let cancelled = false

    const fetchInvoices = async () => {
      // Reset loading and errors before starting
      setLoading(true)
      setError(null)
      setValidationErrors(null)

      if (!token) {
        // No auth token means user is not authenticated
        setError(new Error('User not authenticated'))
        setInvoices([])
        setTotal(0)
        setLoading(false)
        return
      }

      try {
        // Fetch invoices from API
        // Optionally, modify getInvoices to send Accept-Language header using `lang`
        const resp: InvoiceApiResponse = await getInvoices(filters, token)
        if (cancelled) return

        // Update state with the fetched data
        setInvoices(resp.data.data)
        setTotal(resp.data.meta.total)
      } catch (err: any) {
        if (cancelled) return

        if (err.response?.status === 422) {
          // Validation errors (unprocessable entity)
          setValidationErrors(err.response.data.errors)
        } else {
          // General/network error
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchInvoices()

    return () => {
      // Mark as cancelled to avoid state updates after unmount or filters change
      cancelled = true
    }
    // stringify filters to trigger effect only when contents change
  }, [JSON.stringify(filters), token, lang])

  return { invoices, total, loading, error, validationErrors }
}
