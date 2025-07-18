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
import OlympicLoader from './../components/OlympicLoader';
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
 * UserDashboardPage
 * Page for managing user profile settings.
 * It allows users to view and update their name, email, password, and two-factor authentication
 * settings.
 */
export default function UserDashboardPage(): JSX.Element {
  const { t } = useTranslation('userDashboard');
  const token = useAuthStore((state) => state.authToken);

  // Local state for user data, loading status, and any error message
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // If no token, skip fetch and mark as not loading
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
        // Fetch user profile, passing abort signal
        const response = await fetchUser(token, { signal });
        if (signal.aborted) return;
        const { status, data } = response;
        if (status === 200 && data.user) {
          // Populate local user state
          setUser({
            firstname: data.user.firstname,
            lastname: data.user.lastname,
            email: data.user.email,
            twoFAEnabled: data.user.twofa_enabled,
          });
        } else {
          // Unexpected response
          setErrorMsg(t('errors.fetchProfile'));
        }
      } catch (err: any) {
        if (signal.aborted) return;
        // Show translated error based on code or network
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
      // Cleanup on unmount or token change
      controller.abort();
    };
  }, [token, t]);

  // While fetching, show loader
  if (loadingUser) {
    return (
      <>
        <Seo title={t('seo.title')} description={t('seo.description')} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <OlympicLoader />
        </Box>
      </>
    );
  }

  // On error, display retryable error screen
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

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Main dashboard view
  return (
    <>
      <Seo title={t('seo.title')} description={t('seo.description')} />
      <PageWrapper>
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            {t('dashboard.title')}
          </Typography>
          <Typography variant="body1" gutterBottom align="center" sx={{ mb: 4 }}>
            {t('dashboard.subtitle')}
          </Typography>
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
