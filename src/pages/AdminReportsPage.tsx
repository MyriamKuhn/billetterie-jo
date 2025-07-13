import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Pagination from '@mui/material/Pagination'
import Seo from '../components/Seo'
import { PageWrapper } from '../components/PageWrapper'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { useTranslation } from 'react-i18next'
import OlympicLoader from '../components/OlympicLoader'
import { useAuthStore } from '../stores/useAuthStore'
import { AdminReportsGrid } from '../components/AdminReportsGrid'
import { useLanguageStore } from '../stores/useLanguageStore'
import { useAdminReports, type Filters } from '../hooks/useAdminReports'
import { AdminReportsFilter } from '../components/AdminReportsFilter'

export default function AdminReportsPage() {
  const { t } = useTranslation('reports');
  const token = useAuthStore((state) => state.authToken);
  const lang = useLanguageStore((state) => state.lang);

  // État des filtres initiaux
  const [filters, setFilters] = useState<Filters>({
    sort_by: 'sales_count',
    sort_order: 'desc',
    per_page: 10,
    page: 1,
  })

  const { reports, total, loading, error, validationErrors } = useAdminReports(filters, token!, lang)

  useEffect(() => {
    if (validationErrors) {
      const cleanup: Partial<Filters> = {};
  
      if (validationErrors.sort_by) { cleanup.sort_by = 'sales_count'; }
      if (validationErrors.sort_order) { cleanup.sort_order = 'desc'; }
      if (validationErrors.per_page) { cleanup.per_page = 5; }
      if (validationErrors.page) { cleanup.page = 1; }
  
      setFilters(f => ({ ...f, ...cleanup }));
    }
  }, [validationErrors]);

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
        <Typography variant="h4" sx={{ px:2 }}>
          {t('reports.title')}
        </Typography>
        <Box sx={{ display:'flex', flexDirection:{ xs:'column', md:'row' }, gap:2, p:2 }}>
          {/* Sidebar filtres */}
          <AdminReportsFilter filters={filters} onChange={upd=>setFilters(f=>({...f,...upd}))}/>

          {/* Contenu principal */}
          <Box component="main" flex={1}>
            {loading
              ? <Box textAlign="center" py={8}><OlympicLoader/></Box>
              : <AdminReportsGrid
                  reports={reports}
                />
              }
            {!loading && reports.length>0 && (
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
