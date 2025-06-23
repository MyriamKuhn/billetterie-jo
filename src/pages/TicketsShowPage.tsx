import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Pagination from '@mui/material/Pagination'
import Seo from '../components/Seo'
import { PageWrapper } from '../components/PageWrapper'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { TicketsFilters } from '../components/TicketsFilters'
import { TicketGrid } from '../components/TicketGrid'
import type { TicketFilters } from '../types/tickets'
import { useTickets } from '../hooks/useTickets'
import { useTranslation } from 'react-i18next'
import OlympicLoader from '../components/OlympicLoader'

export default function TicketsPage() {
  const { t } = useTranslation('tickets')
  // État des filtres initiaux
  const [filters, setFilters] = useState<TicketFilters>({
    status: '',
    per_page: 5,
    page: 1,
    event_date_from: '',
    event_date_to: '',
  })
  const { tickets, total, loading, error, validationErrors } = useTickets(filters)

  // Gérer les erreurs de validation en réinitialisant les filtres invalides si besoin
  React.useEffect(() => {
    if (!validationErrors) return
    const newFilters: Partial<TicketFilters> = {}
    if (validationErrors.q) newFilters.status = ''
    if (validationErrors.event_date_from) newFilters.event_date_from = ''
    if (validationErrors.event_date_to) newFilters.event_date_to = ''
    if (validationErrors.per_page) newFilters.per_page = 5
    if (validationErrors.page) newFilters.page = 1
    setFilters(f => ({ ...f, ...newFilters }))
  }, [validationErrors])

  if (error) {
    return (
      <PageWrapper>
        <ErrorDisplay
          title={t('errors.title')}
          message={t('errors.message')}
          showRetry
          retryButtonText={t('errors.retry')}
          onRetry={() => setFilters(f => ({ ...f }))}
          showHome
          homeButtonText={t('errors.go_home')}
        />
      </PageWrapper>
    )
  }

  return (
    <>
      <Seo title={t('seo.title')} description={t('seo.description')} />
      <PageWrapper disableCard>
        <Typography variant="h4" sx={{ px: 2 }}>
          {t('tickets.title')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, p: 2 }}>
          <TicketsFilters filters={filters} onChange={upd => setFilters(f => ({ ...f, ...upd }))} />
          <Box component="main" flex={1}>
            {loading
              ? <Box textAlign="center" py={8}><OlympicLoader/></Box>
              : <TicketGrid tickets={tickets} />
            }
            {!loading && tickets.length > 0 && (
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
