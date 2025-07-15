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
 * AdminDashboardPage component
 * Displays the admin dashboard with user profile management features.
 * Fetches user data and allows updating name, email, password, and two-factor authentication settings.
 */
export default function AdminDashboardPage(): JSX.Element {
  const { t } = useTranslation('userDashboard');
  const token = useAuthStore((state) => state.authToken);

  // Local state for user profile data
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // If not authenticated, skip fetching
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
        // Fetch user profile, abortable via signal
        const response = await fetchUser(token, { signal });
        if (signal.aborted) return;
        const { status, data } = response;
        if (status === 200 && data.user) {
          // Map API response to our local UserProfile
          setUser({
            firstname: data.user.firstname,
            lastname: data.user.lastname,
            email: data.user.email,
            twoFAEnabled: data.user.twofa_enabled,
          });
        } else {
          // Non-200 without exception
          setErrorMsg(t('errors.fetchProfile'));
        }
      } catch (err: any) {
        if (signal.aborted) return;
        if (axios.isAxiosError(err) && err.response) {
          // Use error code from response if available
          const respData = err.response.data;
          const code = respData?.code;
          setErrorMsg(getErrorMessage(t, code ?? 'generic_error'));
        } else {
          setErrorMsg(getErrorMessage(t, 'network_error'));
        }
      } finally {
        // Only update loading if not aborted
        if (!signal.aborted) {
          setLoadingUser(false);
        }
      }
    };
    loadUser();

    return () => {
      // Cancel fetch on unmount or token change
      controller.abort();
    };
  }, [token, t]);

  // Show loader while fetching user
  if (loadingUser) {
    return (
      <>
        <Seo title={t('seo.title_admin')} description={t('seo.description_admin')} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <OlympicLoader />
        </Box>
      </>
    );
  }

  // Show error UI if retrieval failed
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

  // Redirect to login if not authenticated or no user data
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Main dashboard UI
  return (
    <>
      <Seo title={t('seo.title_admin')} description={t('seo.description_admin')} />
      <PageWrapper>
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            {t('dashboard.title_admin')}
          </Typography>
          <Typography variant="body1" gutterBottom align="center" sx={{ mb: 4 }}>
            {t('dashboard.subtitle_admin')}
          </Typography>
          <Stack spacing={2}>
            {/* Section to update name */}
            <NameSection user={user} onUpdate={(vals) => setUser(prev => ({ ...prev!, ...vals }))}/>
              {/* Section to update email */}
            <EmailSection currentEmail={user.email} onUpdate={(newEmail) => setUser(prev => ({ ...prev!, email: newEmail }))}/>
            {/* Section to change password */}
            <PasswordSection />
            {/* Section to enable/disable two-factor auth */}
            <TwoFASection enabled={user.twoFAEnabled} onToggle={(enabled) => setUser(prev => ({ ...prev!, twoFAEnabled: enabled }))} />
          </Stack>
        </Box>
      </PageWrapper>
    </>
  );
}
