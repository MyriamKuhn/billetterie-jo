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

interface LocationState {
  paymentUuid?: string;
}

interface PaymentDetails {
  status: string;
  paid_at: string;
}

export default function ConfirmationPage() {
  const { t } = useTranslation(['confirmation', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.authToken);
  const lang = useLanguageStore((s) => s.lang);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentDetails | null>(null);

  useEffect(() => {
    const state = location.state as LocationState;
    let paymentUuid = state?.paymentUuid;
    // Optionnel: lire depuis query param si besoin
    const params = new URLSearchParams(location.search);
    if (!paymentUuid && params.get('paymentUuid')) {
      paymentUuid = params.get('paymentUuid')!;
    }

    if (!paymentUuid) {
      setError(t('confirmation:no_uuid', 'Informations de paiement manquantes.'));
      setLoading(false);
      return;
    }
    if (!token) {
      // Si pas de token, rediriger vers login ou afficher message
      setError(t('confirmation:not_authenticated', 'Vous devez être connecté pour voir la confirmation.'));
      setLoading(false);
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    const fetchInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        // Ici on utilise getPaymentStatus pour récupérer le statut / détails
        const { status, data } = await getPaymentStatus(paymentUuid, token);
        if (status === 200 && data) {
          // data correspond à PaymentStatusResponse, éventuellement wrapper selon votre service
          // Si getPaymentStatus renvoie { data: PaymentStatusResponse }, c’est correct.
          setPaymentInfo(data as PaymentDetails);
        } else {
          // statut inattendu
          console.warn('Statut inattendu getPaymentStatus:', status, data);
          setError(t('confirmation:fetch_error', 'Impossible de récupérer les informations de paiement.'));
        }
      } catch (err: any) {
        console.error('Erreur fetch confirmation via getPaymentStatus:', err);
        const msg =
          err.response?.data?.error ||
          err.message ||
          t('confirmation:fetch_error', 'Impossible de récupérer les informations de paiement.');
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [location, token, lang, navigate, t]);

  if (loading) {
    return (
      <>
        <Seo title={t('confirmation:loading_title', 'Chargement...')} description={t('confirmation:loading_description', 'Veuillez patienter pendant le chargement des informations de paiement.')} />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <OlympicLoader />
        </Box>
      </>
    );
  }
  if (error) {
    return (
      <PageWrapper>
        <ErrorDisplay
          title={t('confirmation:error_title', 'Erreur de confirmation')}
          message={error}
          showRetry={false}
          showHome={true}
          homeButtonText={t('common:home', 'Accueil')}
        />
      </PageWrapper>
    );
  }
  if (!paymentInfo) {
    return null;
  }

  return (
    <>
      <Seo title={t('confirmation:page_title', 'Confirmation de paiement')} description={t('confirmation:page_description', 'Merci pour votre achat ! Vos billets ont été envoyés par mail.')} />
      <PageWrapper>
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
          <Typography variant="h4" gutterBottom>
            {t('confirmation:thank_you', 'Merci pour votre achat !')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('confirmation:see_mail', "Vos billets ont été envoyés par mail. Il est inutile de les imprimer, il suffira de présenter le code QR sur votre téléphone mobile à l'entrée. Si vous n'avez pas réceptionné les billets par mail, veuillez vérifier vos courriers indésirables ou téléchargez-les dans votre espace client.")}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('confirmation:paid_at', 'Date de paiement : {{date}}', {
              date: paymentInfo.paid_at ? new Date(paymentInfo.paid_at).toLocaleString() : '-',
            })}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => navigate('/')}>
              {t('confirmation:continue_shopping', 'Continuer mes achats')}
            </Button>
            <Button variant="text" sx={{ ml: 2 }} onClick={() => navigate('/user/orders')}>
              {t('confirmation:view_orders', 'Voir mes commandes')}
            </Button>
            <Button variant="text" sx={{ ml: 2 }} onClick={() => navigate('/user/tickets')}>
              {t('confirmation:view_tickets', 'Voir mes billets')}
            </Button>
          </Box>
        </Box>
      </PageWrapper>
    </>
  );
}
