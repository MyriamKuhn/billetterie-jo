import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/useAuthStore';
import { useLanguageStore } from '../stores/useLanguageStore';
import { getPaymentStatus } from '../services/paymentService';
import OlympicLoader from '../components/OlympicLoader';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { PageWrapper } from '../components/PageWrapper';
import Seo from '../components/Seo';
import { logError, logWarn } from '../utils/logger';
import { useCartStore } from '../stores/useCartStore';

interface LocationState {
  paymentUuid?: string;
}

interface PaymentDetails {
  status: string;
  paid_at: string;
}

/**
 * ConfirmationPage
 * Shows the confirmation of a payment after successful checkout.
 * Fetches payment details using the payment UUID from location state or query params.
 * Handles loading state, errors, and displays payment information.
 */
export default function ConfirmationPage() {
  const { t } = useTranslation('checkout');
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.authToken);
  const lang = useLanguageStore((s) => s.lang);

  const unlockCart = useCartStore((s) => s.unlockCart);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentDetails | null>(null);

  useEffect(() => {
    // Ensure cart is unlocked once on page load
    unlockCart();

    // Try to get paymentUuid from location state or query params
    const state = location.state as LocationState;
    let paymentUuid = state?.paymentUuid;
    const params = new URLSearchParams(location.search);
    if (!paymentUuid && params.get('paymentUuid')) {
      paymentUuid = params.get('paymentUuid')!;
    }

    // If missing UUID, show error
    if (!paymentUuid) {
      setError(t('errors.no_uuid'));
      setLoading(false);
      return;
    }
    // If not authenticated, redirect to login
    if (!token) {
      setError(t('errors.not_authenticated'));
      setLoading(false);
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    // Fetch payment status from the backend
    const fetchInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        const { status, data } = await getPaymentStatus(paymentUuid, token);
        if (status === 200 && data) {
          setPaymentInfo(data as PaymentDetails);
        } else {
          logWarn('Unexpected status getPaymentStatus:', data);
          setError(t('errors.fetch_error'));
        }
      } catch (err: any) {
        logError('Error fetching payment status:', err);
        setError(t('errors.fetch_error'));
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [location, token, lang, navigate, t, unlockCart]);

  // Format paid_at timestamp for display
  const formattedDate = paymentInfo?.paid_at
    ? new Date(paymentInfo.paid_at).toLocaleString(lang, {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  // Loading state
  if (loading) {
    return (
      <>
        <Seo title={t('seo.confirmation_title')} description={t('seo.confirmation_description')} />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <OlympicLoader />
        </Box>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <PageWrapper>
        <ErrorDisplay
          title={t('errors.error_confirmation')}
          message={error}
          showRetry={false}
          showHome={true}
          homeButtonText={t('confirmation.go_home')}
        />
      </PageWrapper>
    );
  }

  // Success state
  return (
    <>
      <Seo title={t('seo.confirmation_title')} description={t('seo.confirmation_description')} />
      <PageWrapper>
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
          <Typography variant="h4" gutterBottom>
            {t('confirmation.thank_you')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('confirmation.see_mail')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('confirmation.paid_at', { date: formattedDate })}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => navigate('/')}>
              {t('confirmation.continue_shopping')}
            </Button>
            <Button variant="text" sx={{ ml: 2 }} onClick={() => navigate('/user/orders')}>
              {t('confirmation.view_orders')}
            </Button>
            <Button variant="text" sx={{ ml: 2 }} onClick={() => navigate('/user/tickets')}>
              {t('confirmation.view_tickets')}
            </Button>
          </Box>
        </Box>
      </PageWrapper>
    </>
  );
}
