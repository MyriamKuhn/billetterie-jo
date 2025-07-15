import { useState, useEffect } from 'react'
import type { Ticket } from '../types/tickets'
import type { TicketsApiResponse, TicketFilters } from '../types/tickets'
import { getUserTickets } from '../services/billingService'
import { useAuthStore } from '../stores/useAuthStore'

interface UseTicketsResult {
  tickets: Ticket[];
  total: number;
  loading: boolean;
  error: Error | null;
  validationErrors: any; 
}

/**
 * Hook to load user tickets based on provided filters.
 * @param filters TicketFilters
 */
export function useTickets(filters: TicketFilters): UseTicketsResult {
  const token = useAuthStore(s => s.authToken)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [validationErrors, setValidationErrors] = useState<any>(null)

  useEffect(() => {
    let cancelled = false
    const fetchTickets = async () => {
      setLoading(true)
      setError(null)
      setValidationErrors(null)

      if (!token) {
        setError(new Error('User not authenticated'))
        setTickets([])
        setTotal(0)
        setLoading(false)
        return
      }

      try {
        const resp: TicketsApiResponse = await getUserTickets(filters, token)
        if (cancelled) return
        setTickets(resp.data.data)
        if (resp.data.meta && typeof resp.data.meta.total === 'number') {
          setTotal(resp.data.meta.total)
        } else {
          setTotal(resp.data.data.length)
        }
      } catch (err: any) {
        if (cancelled) return
        if (err.response?.status === 422) {
          setValidationErrors(err.response.data.errors)
        } else {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchTickets()
    return () => {
      cancelled = true
    }
  }, [JSON.stringify(filters), token])

  return { tickets, total, loading, error, validationErrors }
}
