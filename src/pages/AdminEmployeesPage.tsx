import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import OlympicLoader from '../components/OlympicLoader';
import Seo from '../components/Seo';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import { UsersFilters } from '../components/UsersFilters';
import { AdminUserGrid } from '../components/AdminUserGrid';
import type { Filters } from '../hooks/useUsers';
import { useUsers } from '../hooks/useUsers';
import { PageWrapper } from '../components/PageWrapper';
import { useTranslation } from 'react-i18next';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { useAuthStore } from '../stores/useAuthStore';
import { useUserUpdate } from '../hooks/useUserUpdate';
import { AdminUserDetailsModal } from '../components/AdminUserDetailsModal';
import { useLanguageStore } from '../stores/useLanguageStore';
import { AdminEmployeeCreateModal } from '../components/AdminEmployeeCreateModal';

/**
 * AdminEmployeesPage component displays a list of employees with filtering, pagination,
 * and modals for viewing details and creating new employees.
 */
export default function AdminEmployeesPage() {
  const { t } = useTranslation('users');
  const lang = useLanguageStore((state) => state.lang);
  const token = useAuthStore((state) => state.authToken);
  const updateUser = useUserUpdate();

  // ---------------------------------------------------------------------------
  // Local UI state for filters, selected detail modal, and create modal
  // ---------------------------------------------------------------------------
  type UIFilters = Omit<Filters, 'role'>;
  const [filters, setFilters] = useState<UIFilters>({
    firstname:'', lastname:'', email:'', perPage:10, page:1
  });

  // ---------------------------------------------------------------------------
  // Fetch users using our custom hook; re-fetches when filters, token, or role change
  // ---------------------------------------------------------------------------
  const { users, total, loading, error, validationErrors } = useUsers(filters, token!, 'employee');

  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // If backend validation errors arise, clear the corresponding filter fields
  // ---------------------------------------------------------------------------
  useEffect(() => {
  if (validationErrors) {
    const cleanup: Partial<Filters> = {};

    if (validationErrors.firstname) { cleanup.firstname   = ''; }
    if (validationErrors.lastname) { cleanup.lastname   = ''; }
    if (validationErrors.email) { cleanup.email = ''; }

    setFilters(f => ({ ...f, ...cleanup }));
  }
}, [validationErrors]);

  // ---------------------------------------------------------------------------
  // Error state: show full-page error with retry
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <PageWrapper>
        <ErrorDisplay
          title={t('errors.title')}
          message={t('errors.unexpected_employee')}
          showRetry
          retryButtonText={t('errors.retry')}
          onRetry={() => setFilters(f => ({ ...f }))}
          showHome
          homeButtonText={t('errors.home')}
        />
      </PageWrapper>
    );
  }
  
  // ---------------------------------------------------------------------------
  // Main render: SEO, filters sidebar, user grid, pagination, and modals
  // ---------------------------------------------------------------------------
  return (
    <>
      <Seo title={t('seo.title_employee')} description={t('seo.description_employee')} />
      {/* Disable card wrapper so we control the background fully */}
      <PageWrapper disableCard>
        <Typography variant="h4" sx={{ px:2 }}>
          {t('employees.title')}
        </Typography>
        <Box sx={{ display:'flex', flexDirection:{ xs:'column', md:'row' }, gap:2, p:2 }}>
          {/* Filters sidebar */}
          <UsersFilters role='employee' filters={filters} onChange={upd=>setFilters(f=>({...f,...upd}))}/>

          {/* Main content area */}
          <Box component="main" flex={1}>
            {loading
              ? <Box textAlign="center" py={8}><OlympicLoader/></Box>
              : <AdminUserGrid
                  lang= {lang}
                  users={users}
                  onViewDetails={setDetailsId}
                  onSave={async (id, updates) => {
                    const ok = await updateUser(id, {
                      is_active: updates.is_active,
                      twofa_enabled: updates.twofa_enabled,
                      firstname: updates.firstname,
                      lastname: updates.lastname,
                      email: updates.email,
                      role: "employee",
                      verify_email: updates.verify_email
                    });
                    return ok;
                  }}
                  onRefresh={() => setFilters(f => ({ ...f }))}
                  isEmployee={true}
                  onCreate={() => setCreateOpen(true)}
                />
              }
            
            {/* Pagination controls, shown only when not loading and there are users */}
            {!loading && users.length>0 && (
              <Box textAlign="center" mt={4}>
                <Pagination
                  count={Math.ceil(total/filters.perPage)||1}
                  page={filters.page}
                  onChange={(_,p)=>setFilters(f=>({...f,page:p}))}
                />
              </Box>
            )}
          </Box>
        </Box>
      </PageWrapper>

      {/* User details modal */}
      <AdminUserDetailsModal
        open={detailsId !== null}
        userId={detailsId}
        token={token!}
        onClose={() => setDetailsId(null)}
        lang={lang}
        isEmployee={true}
      />

      {/* Create new employee modal */}
      <AdminEmployeeCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onRefresh={() => setFilters(f=>({...f}))}
      />
    </>
  );
}