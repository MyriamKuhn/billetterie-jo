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

export default function UserDashboardPage(): JSX.Element {
  const { t } = useTranslation('userDashboard');
  const token = useAuthStore((state) => state.authToken);

  // États initiaux: charger les données utilisateur existantes
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      setLoadingUser(true);
      setErrorMsg(null);
      try {
        if (!token) {
          if (isMounted) {
            setUser(null);
          }
          return;
        }
        const response = await fetchUser(token);
        const { status, data } = response;
        if (status === 200 && data.user) {
          if (isMounted) {
            setUser({
              firstname: data.user.firstname,
              lastname: data.user.lastname,
              email: data.user.email,
              twoFAEnabled: data.user.twofa_enabled,
            });
          }
        } else {
          if (isMounted) {
            setErrorMsg(t('errors.fetchProfile'));
          }
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
        const { data } = err.response;
        if (data.code) {
            if (isMounted) setErrorMsg(getErrorMessage(t, data.code));
          } else {
            if (isMounted) setErrorMsg(getErrorMessage(t, 'generic_error'));
          }
        } else {
          if (isMounted) setErrorMsg(getErrorMessage(t, 'network_error'));
        }
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    }
    loadUser()
    return () => {
      isMounted = false;
    };
  }, [token, t]);

  if (loadingUser) {
    return (
      <PageWrapper>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <OlympicLoader />
        </Box>
      </PageWrapper>
    );
  }

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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

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
            <NameSection user={user} onUpdate={(vals) => setUser((prev) => prev ? ({ ...prev, ...vals }) : prev)} />
            <EmailSection currentEmail={user.email} onUpdate={(newEmail) => setUser((prev) => prev ? ({ ...prev, email: newEmail }) : prev)} />
            <PasswordSection />
            <TwoFASection enabled={user.twoFAEnabled} onToggle={(enabled) => setUser((prev) => prev ? ({ ...prev, twoFAEnabled: enabled }) : prev)} />
          </Stack>
        </Box>
      </PageWrapper>
    </>
  );
}
