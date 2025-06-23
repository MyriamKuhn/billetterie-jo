import { useState, useEffect } from 'react'
import type { Invoice, InvoiceApiResponse, InvoiceFilters } from '../types/invoices'
import { getInvoices } from '../services/billingService'
import { useAuthStore } from '../stores/useAuthStore'

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
      // On réinitialise les états d’erreur avant la requête
      setLoading(true)
      setError(null)
      setValidationErrors(null)

      if (!token) {
        // Pas de token = pas authentifié
        setError(new Error('User not authenticated'))
        setInvoices([])
        setTotal(0)
        setLoading(false)
        return
      }

      try {
        // Si tu veux passer lang comme header Accept-Language, tu peux surcharger getInvoices
        const resp: InvoiceApiResponse = await getInvoices(filters, token)
        if (cancelled) return

        // resp.data est InvoiceResponse
        // InvoiceResponse.data est Invoice[]
        setInvoices(resp.data.data)
        setTotal(resp.data.meta.total)
      } catch (err: any) {
        if (cancelled) return

        // Si c'est une erreur de validation 422
        if (err.response?.status === 422) {
          setValidationErrors(err.response.data.errors)
        } else {
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
      // À la destruction ou avant un nouveau fetch, on marque annulé
      cancelled = true
    }
    // Dépendances :
    // - JSON.stringify(filters) si tu veux comparer le contenu. 
    //   Attention : ça peut déclencher souvent si l'ordre des clés change ou si filters est reconstruit à chaque render.
    //   Si filters vient d'un state/setState et que tu changes uniquement par setFilters, 
    //   tu peux directement utiliser [filters, token, lang].
  }, [JSON.stringify(filters), token, lang])

  return { invoices, total, loading, error, validationErrors }
}
