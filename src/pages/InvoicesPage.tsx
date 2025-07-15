import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Pagination from '@mui/material/Pagination'
import Seo from '../components/Seo'
import { PageWrapper } from '../components/PageWrapper'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { InvoicesFilters } from '../components/InvoicesFilters'
import { InvoiceGrid } from '../components/InvoiceGrid'
import { useInvoices } from '../hooks/useInvoices'
import { useLanguageStore } from '../stores/useLanguageStore'
import type { InvoiceFilters } from '../types/invoices'
import OlympicLoader from '../components/OlympicLoader'
import { useTranslation } from 'react-i18next'

/**
 * InvoicesPage component displays a list of invoices with filters and pagination.
 * It fetches invoices based on the selected filters and language.
 * It handles loading states, errors, and validation of filters.
 * It also provides a retry mechanism in case of errors.  
 */
export default function InvoicesPage() {
  const lang = useLanguageStore(s => s.lang)
  const { t } = useTranslation('invoices')

  // Initial filters state
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: '',
    date_from: '',
    date_to: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 15,
    page: 1,
  })
  const { invoices, total, loading, error, validationErrors } = useInvoices(filters, lang)

  // When validation errors come back, reset invalid filter fields to defaults
  useEffect(() => {
    if (!validationErrors) return

    const newFilters: Partial<InvoiceFilters> = {
      ...(validationErrors.status     && { status:     ''             }),
      ...(validationErrors.date_from  && { date_from:  ''             }),
      ...(validationErrors.date_to    && { date_to:    ''             }),
      ...(validationErrors.sort_by    && { sort_by:    'created_at'   }),
      ...(validationErrors.sort_order && { sort_order: 'desc'         }),
      ...(validationErrors.per_page   && { per_page:   15             }),
      ...(validationErrors.page       && { page:       1              }),
    }

    // Merge cleaned filters back into state
    setFilters(f => ({ ...f, ...newFilters }))
  }, [validationErrors])

  // Show error screen if loading failed
  if (error) {
    return (
      <PageWrapper>
        <ErrorDisplay
          title={t('errors.title')}
          message={t('errors.message')}
          showRetry
          retryButtonText={t('invoices.retry')}
          onRetry={() => setFilters(f => ({ ...f }))}
          showHome
          homeButtonText={t('invoices.go_home')}
        />
      </PageWrapper>
    )
  }

  return (
    <>
      <Seo title={t('seo.title')} description={t('seo.description')} />
      <PageWrapper disableCard>
        <Typography variant="h4" sx={{ px: 2 }}>
          {t('invoices.title')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, p: 2 }}>
          {/* Filters sidebar */}
          <InvoicesFilters filters={filters} onChange={upd => setFilters(f => ({ ...f, ...upd }))} />

          {/* Main content */}
          <Box component="main" flex={1}>
            {loading
              ? <Box textAlign="center" py={8}><OlympicLoader/></Box>
              : <InvoiceGrid invoices={invoices} />
            }

            {/* Pagination */}
            {!loading && invoices.length > 0 && (
              <Box textAlign="center" mt={4}>
                <Pagination
                  count={Math.ceil(total / filters.per_page) || 1}
                  page={filters.page}
                  onChange={(_, p) => setFilters(f => ({ ...f, page: p }))}
                />
              </Box>
            )}
          </Box>
        </Box>
      </PageWrapper>
    </>
  )
}
