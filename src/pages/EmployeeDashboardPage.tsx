import { useState, useEffect, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import Seo from '../components/Seo';
import { PageWrapper } from '../components/PageWrapper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import axios from 'axios';
import { fetchUser } from '../services/userService';
import { useAuthStore } from '../stores/useAuthStore';
import { getErrorMessage } from '../utils/errorUtils';
import OlympicLoader from '../components/OlympicLoader';
import { Navigate } from 'react-router-dom';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { NameSection } from '../components/NameSection';
import { EmailSection } from '../components/EmailSection';
import { PasswordSection } from '../components/PasswordSection';
import { TwoFASection } from '../components/TwoFASection';

export interface UserProfile {
  firstname: string;
  lastname: string;
  email: string;
  twoFAEnabled: boolean;
}

/**
 * Page for the employee dashboard, allowing users to view and update their profile information.
 * It includes sections for name, email, password, and two-factor authentication settings.
 * The page handles loading states, errors, and redirects if the user is not authenticated.
 */
export default function EmployeeDashboardPage(): JSX.Element {
  const { t } = useTranslation('userDashboard');
  const token = useAuthStore((state) => state.authToken);

  // User state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // If not authenticated, stop loading
    if (!token) {
      setUser(null);
      setLoadingUser(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const loadUser = async () => {
      setLoadingUser(true);
      setErrorMsg(null);
      try {
        // Fetch current user profile
        const response = await fetchUser(token, { signal });
        if (signal.aborted) return;
        const { status, data } = response;
        if (status === 200 && data.user) {
          setUser({
            firstname: data.user.firstname,
            lastname: data.user.lastname,
            email: data.user.email,
            twoFAEnabled: data.user.twofa_enabled,
          });
        } else {
          setErrorMsg(t('errors.fetchProfile'));
        }
      } catch (err: any) {
        if (signal.aborted) return;
        // Handle Axios errors
        if (axios.isAxiosError(err) && err.response) {
          const respData = err.response.data;
          const code = respData?.code;
          setErrorMsg(getErrorMessage(t, code ?? 'generic_error'));
        } else {
          setErrorMsg(getErrorMessage(t, 'network_error'));
        }
      } finally {
        if (!signal.aborted) {
          setLoadingUser(false);
        }
      }
    };
    loadUser();
    return () => {
      controller.abort();
    };
  }, [token, t]);

  // Show loader while fetching
  if (loadingUser) {
    return (
      <>
        <Seo title={t('seo.title_employee')} description={t('seo.description_employee')} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <OlympicLoader />
        </Box>
      </>
    );
  }

  // Show error if fetch failed
  if (errorMsg) {
    return (
      <PageWrapper>
        <ErrorDisplay
          title={t('errors.genericErrorTitle')}
          message={errorMsg}
          showRetry={true}
          retryButtonText={t('errors.retry')}
          onRetry={() => {
            window.location.reload();
          }}
          showHome={true}
          homeButtonText={t('errors.home')}
        />
      </PageWrapper>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Main dashboard content
  return (
    <>
      <Seo title={t('seo.title_employee')} description={t('seo.description_employee')} />
      <PageWrapper>
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, mb: 4 }}>
          {/* Page heading */}
          <Typography variant="h4" gutterBottom align="center">
            {t('dashboard.title_employee')}
          </Typography>
          <Typography variant="body1" gutterBottom align="center" sx={{ mb: 4 }}>
            {t('dashboard.subtitle_employee')}
          </Typography>
          {/* Profile sections */}
          <Stack spacing={2}>
            <NameSection user={user} onUpdate={(vals) => setUser(prev => ({ ...prev!, ...vals }))}/>
            <EmailSection currentEmail={user.email} onUpdate={(newEmail) => setUser(prev => ({ ...prev!, email: newEmail }))}/>
            <PasswordSection />
            <TwoFASection enabled={user.twoFAEnabled} onToggle={(enabled) => setUser(prev => ({ ...prev!, twoFAEnabled: enabled }))} />
          </Stack>
        </Box>
      </PageWrapper>
    </>
  );
}