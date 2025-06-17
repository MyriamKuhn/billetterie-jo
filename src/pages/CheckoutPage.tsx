import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Card      from '@mui/material/Card';
import AlertMessage from '../components/AlertMessage';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import { createPayment, getPaymentStatus } from '../services/paymentService';
import { useLanguageStore } from '../stores/useLanguageStore';
import OlympicLoader from '../components/OlympicLoader';
import { PageWrapper } from '../components/PageWrapper';
import Seo from '../components/Seo';

// Wrapper pour charger Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutPage() {
  const lang = useLanguageStore(s => s.lang);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentUuid, setPaymentUuid] = useState<string | null>(null);

  const elementsKey = `stripe-elements-${lang}-${clientSecret ? 'ready' : 'no-secret'}`;
  const elementsOptions: StripeElementsOptions = {
    locale: lang,
    ...(clientSecret ? { clientSecret } : {}),
  };
  // On enveloppe notre formulaire dans Elements
  return (
    <>
      <Seo title="Paiement" description="Procédez au paiement de votre commande en toute sécurité." />
      <PageWrapper disableCard>
        <Elements stripe={stripePromise} key={elementsKey} options={elementsOptions}>
          <CheckoutPageMain setClientSecret={setClientSecret} setPaymentUuid={setPaymentUuid} clientSecret={clientSecret} paymentUuid={paymentUuid} />
        </Elements>
      </PageWrapper>
    </>
  );
}

interface Props {
  setClientSecret: (s: string) => void;
  setPaymentUuid: (u: string) => void;
  clientSecret: string | null;
  paymentUuid: string | null;
}

function CheckoutPageMain({ setClientSecret, setPaymentUuid, clientSecret, paymentUuid }: Props) {
  const hasInitializedRef = useRef(false);

  const { t } = useTranslation(['checkout']);
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [loadingInit, setLoadingInit] = useState<boolean>(true);
  const [errorInit, setErrorInit] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [errorPayment, setErrorPayment] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const clearCart = useCartStore((s) => s.clearCart);
  const cartId = useCartStore((s) => s.cartId);
  const token = useAuthStore((s) => s.authToken);
  const lang = useLanguageStore((s) => s.lang);

  const loadCart = useCartStore((s) => s.loadCart);

  // 1. Charger le panier si token et cartId non présent
  useEffect(() => {
    if (token && !cartId) {
      loadCart().catch(err => console.warn('loadCart error', err));
    }
  }, [token, cartId, loadCart]);

  // 2. Initialiser le paiement quand token + cartId disponibles
  useEffect(() => {
    if (!token) {
      setErrorInit(t('checkout:not_authenticated', 'Vous devez être connecté pour payer.'));
      setLoadingInit(false);
      navigate('/login?next=/checkout');
      return;
    }

    if (!cartId) {
      // Affiche loader panier dans le rendu
      setLoadingInit(true);
      return;
    }

    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    (async () => {
      setLoadingInit(true);
      setErrorInit(null);
      try {
        const { data } = await createPayment(cartId, token, lang);
        if (data?.client_secret) {
          setPaymentUuid(data.uuid);
          setClientSecret(data.client_secret);
        } else {
          throw new Error('Réponse inattendue du serveur');
        }
      } catch (err: any) {
        console.error('Error init payment:', err);
        setErrorInit(err.message || t('checkout:init_error', 'Erreur initialisation paiement'));
      } finally {
        setLoadingInit(false);
      }
    })();
  }, [token, cartId, lang, navigate, t, setClientSecret, setPaymentUuid]);

  // 2. Handler de soumission du formulaire
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorPayment(null);

      if (!stripe || !elements) return;

      if (!clientSecret || !paymentUuid) {
        setErrorPayment(t('checkout:no_client_secret', 'Impossible de traiter le paiement.'));
        return;
      }

      // Démarrage du process : on disable le bouton
      setProcessing(true);
      setStatusMessage(null);
      setPollingStatus(true);

      // Récupérer CardElement
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setErrorPayment(t('checkout:no_card_element', 'Problème avec le champ carte.'));
        setProcessing(false);
        setPollingStatus(false);
        return;
      }

      try {
        const { error } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: { card: cardElement } }
        );

        if (error) {
          console.warn('Stripe confirm error:', error);
          setErrorPayment(error.message || t('checkout:card_error', 'Erreur carte'));
          setProcessing(false);
          setPollingStatus(false);
          return;
        }

        // On attend la confirmation via polling
        setStatusMessage(t('checkout:waiting_confirmation', 'Paiement en cours de confirmation...'));

        let finalStatus: string | null = null;
        while (true) {
          // Attendre 2 secondes
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 2000));

          if (!token) {
            setErrorInit(t('checkout:not_authenticated', 'Vous devez être connecté pour payer.'));
            navigate('/login');
            return;
          }

          try {
            const { status, data } = await getPaymentStatus(paymentUuid, token);
            if (status === 200 && data) {
              const PaymentStatus = data.status;
              console.log('Polling payment status:', PaymentStatus);
              if (PaymentStatus.toLowerCase() === 'succeeded' || PaymentStatus.toLowerCase() === 'paid') {
                finalStatus = 'paid';
                break;
              }
              if (['requires_payment_method','failed','canceled'].includes(PaymentStatus.toLowerCase())) {
                finalStatus = 'failed';
                break;
              }
            } else {
              console.warn('Statut de paiement inattendu:', data);
            }
          } catch (pollErr) {
            console.error('Erreur polling status:', pollErr);
          }
        }

        if (finalStatus === 'paid') {
          setStatusMessage(t('checkout:payment_success', 'Paiement confirmé !'));

          try {
            await clearCart();
          } catch (clearErr) {
            console.error('Erreur clearCart après paiement:', clearErr);
          }
          navigate('/confirmation', { state: { paymentUuid } });
          return;
        } else {
          setErrorPayment(t('checkout:payment_failed', 'Le paiement a échoué. Vous pouvez réessayer.'));
          setProcessing(false);
          setPollingStatus(false);
          return;
        }
      } catch (confirmErr: any) {
        console.error('Erreur lors de confirmCardPayment:', confirmErr);
        setErrorPayment(confirmErr.message || t('checkout:confirm_error', 'Erreur lors du paiement'));
        setProcessing(false);
        setPollingStatus(false);
      }
    }
  , [stripe, elements, clientSecret, paymentUuid, clearCart, navigate, t, token]);

  if (errorInit) {
    return (
      <Box sx={{ p: 4 }}>
        <AlertMessage message={errorInit} severity="error" />
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => window.location.reload()}>
            {t('common:retry', 'Réessayer')}
          </Button>
          <Button sx={{ ml: 2 }} variant="outlined" onClick={() => navigate('/cart')}>
            {t('checkout:back_to_cart', 'Retour au panier')}
          </Button>
        </Box>
      </Box>
    );
  }

  if (!cartId || loadingInit || !stripe || !elements) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <OlympicLoader />
        <Typography sx={{ mt: 2 }}>{t('checkout:initializing', 'Initialisation du paiement...')}</Typography>
      </Box>
    );
  }

  if (!clientSecret) {
    // Cas improbable
    return null;
  }

  return (
    <Card
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 500,
        mx: 'auto',
        mt: 4,
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Typography variant="h5" gutterBottom>
        {t('checkout:title', 'Paiement')}
      </Typography>

      {errorPayment && (
        <AlertMessage message={errorPayment} severity="error" />
      )}

      {pollingStatus && statusMessage && (
        <AlertMessage message={statusMessage} severity="info" />
      )}

      <Typography variant="body2" sx={{ mb: 1 }}>
        {t('checkout:card_number_label', 'Numéro de carte')}
      </Typography>

      <Box
        sx={{
          mb: 2,
          border: '1px solid',
          borderColor: errorPayment ? 'error.main' : 'divider',
          borderRadius: 1,
          p: 1,
          backgroundColor: 'background.paper',
          transition: 'border-color 0.2s',
        }}
      >
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
          onFocus={() => {}}
          onBlur={() => {}}
        />
      </Box>

      <Box sx={{ textAlign: 'right', mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || processing || pollingStatus}
          startIcon={
            processing
              ? <CircularProgress color="inherit" size={16} />
              : undefined
          }
        >
          {processing
            ? t('checkout:processing', 'Traitement...')
            : t('checkout:pay_button', 'Payer')}
        </Button>
      </Box>
    </Card>
  );
}
