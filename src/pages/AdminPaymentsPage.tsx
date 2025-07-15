import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Pagination from '@mui/material/Pagination'
import Seo from '../components/Seo'
import { PageWrapper } from '../components/PageWrapper'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { useTranslation } from 'react-i18next'
import OlympicLoader from '../components/OlympicLoader'
import { useAdminPayments, type Filters } from '../hooks/useAdminPayments'
import { useAuthStore } from '../stores/useAuthStore'
import { usePaymentRefund } from '../hooks/usePaymentRefund'
import { AdminPaymentFilters } from '../components/AdminPaymentFilters'
import { AdminPaymentGrid } from '../components/AdminPaymentGrid'

/**
 * AdminPaymentsPage component displays a paginated list of payments
 * with filtering options and the ability to refund payments.
 */
export default function AdminPaymentsPage() {
  const { t } = useTranslation('payments');
  const token = useAuthStore((state) => state.authToken);
  const refunding = usePaymentRefund();

  // initial filter state
  const [filters, setFilters] = useState<Filters>({
    q: '',
    status: '',
    payment_method: '',
    per_page: 5,
    page: 1,
  })

  const { payments, total, loading, error, validationErrors } = useAdminPayments(filters, token!)

  // clear any invalid filter fields returned by validation errors
  useEffect(() => {
    if (validationErrors) {
      const cleanup: Partial<Filters> = {};
  
      if (validationErrors.q)  { cleanup.q   = ''; }
      if (validationErrors.status) { cleanup.status = ''; }
      if (validationErrors.payment_method) { cleanup.payment_method = ''; }
      if (validationErrors.per_page) { cleanup.per_page = 5; }
      if (validationErrors.page) { cleanup.page = 1; }
  
      setFilters(f => ({ ...f, ...cleanup }));
    }
  }, [validationErrors]);

  // show error UI on fetch failure
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
      {/* main layout without card container */}
      <PageWrapper disableCard>
        <Typography variant="h4" sx={{ px:2 }}>
          {t('payments.title')}
        </Typography>
        <Box sx={{ display:'flex', flexDirection:{ xs:'column', md:'row' }, gap:2, p:2 }}>
          {/* filters sidebar */}
          <AdminPaymentFilters filters={filters} onChange={upd=>setFilters(f=>({...f,...upd}))}/>

          {/* main content area */}
          <Box component="main" flex={1}>
            {loading
              ? <Box textAlign="center" py={8}><OlympicLoader/></Box>
              : <AdminPaymentGrid
                  payments={payments}
                  onSave={async (uuid, refund) => {
                    const ok = await refunding(uuid, { amount: refund.amount });
                    return ok;
                  }}
                  onRefresh={() => setFilters(f => ({ ...f }))}
                />
              }

            {/* pagination controls */}  
            {!loading && payments.length>0 && (
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
    </>
  );
}
