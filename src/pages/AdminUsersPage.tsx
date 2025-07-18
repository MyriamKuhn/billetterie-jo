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
 * AdminUsersPage component displays a list of users with admin functionalities.
 * It includes user filters, a grid view, and modals for user details and creation.
 */
export default function AdminUsersPage() {
  const { t } = useTranslation('users');
  const lang = useLanguageStore((state) => state.lang);
  const token = useAuthStore((state) => state.authToken);
  const updateUser = useUserUpdate();

  // State for filters (excluding role)
  type UIFilters = Omit<Filters, 'role'>;
  const [filters, setFilters] = useState<UIFilters>({
    firstname:'', lastname:'', email:'', perPage:10, page:1
  });

  // Fetch users with 'user' role
  const { users, total, loading, error, validationErrors } = useUsers(filters, token!, 'user');

  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Reset invalid filter fields on validation errors
  useEffect(() => {
  if (validationErrors) {
    const cleanup: Partial<Filters> = {};

    if (validationErrors.firstname) { cleanup.firstname   = ''; }
    if (validationErrors.lastname) { cleanup.lastname   = ''; }
    if (validationErrors.email) { cleanup.email = ''; }

    setFilters(f => ({ ...f, ...cleanup }));
  }
}, [validationErrors]);

  // Show error fallback
  if (error) {
    return (
      <PageWrapper>
        <ErrorDisplay
          title={t('errors.title')}
          message={t('errors.unexpected')}
          showRetry
          retryButtonText={t('errors.retry')}
          onRetry={() => setFilters(f => ({ ...f }))}
          showHome
          homeButtonText={t('errors.home')}
        />
      </PageWrapper>
  );
}
  
  // Render the page
  return (
    <>
      {/* SEO tags */}
      <Seo title={t('seo.title')} description={t('seo.description')} />
      {/* Main content (no card) */}
      <PageWrapper disableCard>
        <Typography variant="h4" sx={{ px:2 }}>
          {t('users.title')}
        </Typography>
        <Box sx={{ display:'flex', flexDirection:{ xs:'column', md:'row' }, gap:2, p:2 }}>
          {/* Sidebar filters */}
          <UsersFilters role='user' filters={filters} onChange={upd=>setFilters(f=>({...f,...upd}))}/>

          {/* User grid or loader */}
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
                      role: "user",
                      verify_email: updates.verify_email
                    });
                    return ok;
                  }}
                  onRefresh={() => setFilters(f => ({ ...f }))}
                  isEmployee={false}
                  onCreate={() => setCreateOpen(true)}
                />
              }

            {/* Pagination */}  
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
        isEmployee={false}
      />

      {/* Employee create modal */}
      <AdminEmployeeCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onRefresh={() => setFilters(f=>({...f}))}
      />
    </>
  );
}