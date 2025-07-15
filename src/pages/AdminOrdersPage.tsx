import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Pagination from '@mui/material/Pagination'
import Seo from '../components/Seo'
import { PageWrapper } from '../components/PageWrapper'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { useTranslation } from 'react-i18next'
import OlympicLoader from '../components/OlympicLoader'
import { useAdminTickets, type Filters } from '../hooks/useAdminTickets'
import { useAuthStore } from '../stores/useAuthStore'
import { useTicketStatusUpdate } from '../hooks/useTicketStatusUpdate'
import { AdminTicketsFilters } from '../components/AdminTicketsFilters'
import { AdminTicketGrid } from '../components/AdminTicketGrid'
import { AdminTicketCreateModal } from '../components/AdminTicketCreateModal'

/**
 * AdminOrdersPage component displays a list of orders (tickets) for admin users.
 * It includes filters for status and user, pagination, and the ability to create free tickets.
 * It handles loading states, errors, and validation errors from the backend.
 */
export default function AdminOrdersPage() {
  const { t } = useTranslation('orders');
  const token = useAuthStore((state) => state.authToken);
  const statusUpdate = useTicketStatusUpdate();

  // Initial filter state
  const [filters, setFilters] = useState<Filters>({
    status: '',
    user_id: undefined,
    per_page: 5,
    page: 1,
  })

  const { tickets, total, loading, error, validationErrors } = useAdminTickets(filters, token!)

  const [createFreeOpen, setCreateFreeOpen] = useState(false);

  // Clear invalid user_id when backend returns validation errors
  useEffect(() => {
    if (validationErrors) {
      const cleanup: Partial<Filters> = {};
  
      if (validationErrors.user_id)  { cleanup.user_id   = undefined; }
  
      setFilters(f => ({ ...f, ...cleanup }));
    }
  }, [validationErrors]);

  // Show error page on fetch failure
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
      {/* Main layout without card wrapper */}
      <PageWrapper disableCard>
        <Typography variant="h4" sx={{ px:2 }}>
          {t('orders.title')}
        </Typography>
        <Box sx={{ display:'flex', flexDirection:{ xs:'column', md:'row' }, gap:2, p:2 }}>
          {/* Filters sidebar */}
          <AdminTicketsFilters filters={filters} onChange={upd=>setFilters(f=>({...f,...upd}))}/>

          {/* Main content area */}
          <Box component="main" flex={1}>
            {loading
              ? <Box textAlign="center" py={8}><OlympicLoader/></Box>
              : <AdminTicketGrid
                  tickets={tickets}
                  onSave={async (id, update) => {
                    const ok = await statusUpdate(id, {
                      status: update.status,
                    });
                    return ok;
                  }}
                  onRefresh={() => setFilters(f => ({ ...f }))}
                  onCreate={() => setCreateFreeOpen(true)}
                />
              }

            {/* Pagination controls */}
            {!loading && tickets.length>0 && (
              <Box textAlign="center" mt={4}>
                <Pagination
                  count={Math.ceil(total/filters.per_page)||1}
                  page={filters.page}
                  onChange={(_,p)=>setFilters(f=>({...f,page:p}))}
                />
              </Box>
            )}
          </Box>
        </Box>
      </PageWrapper>

      {/* Modal for creating free ticket */}
      <AdminTicketCreateModal
        open={createFreeOpen}
        onClose={() => setCreateFreeOpen(false)}
        onRefresh={() => setFilters(f=>({...f}))}
      />
    </>
  );
}
