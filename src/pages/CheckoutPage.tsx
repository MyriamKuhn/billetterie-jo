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
import Card from '@mui/material/Card';
import AlertMessage from '../components/AlertMessage';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import { createPayment, getPaymentStatus } from '../services/paymentService';
import { useLanguageStore } from '../stores/useLanguageStore';
import OlympicLoader from '../components/OlympicLoader';
import { PageWrapper } from '../components/PageWrapper';
import Seo from '../components/Seo';
import { logError, logWarn } from '../utils/logger';
import { getErrorMessage } from '../utils/errorUtils';
import axios from 'axios';

// Load Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * CheckoutPage component handles the payment process using Stripe Elements.
 * It initializes the payment, handles form submission, and manages payment status polling.
 */
export default function CheckoutPage() {
  const { t } = useTranslation('checkout');
  const lang = useLanguageStore(s => s.lang);

  // State to hold client secret and payment UUID
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentUuid, setPaymentUuid] = useState<string | null>(null);

  // Re-render Elements when language or clientSecret changes
  const elementsKey = `stripe-elements-${lang}-${clientSecret ? 'ready' : 'no-secret'}`;
  const elementsOptions: StripeElementsOptions = {
    locale: lang,
    ...(clientSecret ? { clientSecret } : {}),
  };

  return (
    <>
      <Seo title={t('seo.title')} description={t('seo.description')} />
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

/**
 * CheckoutPageMain component handles the main logic of the checkout process.
 * It initializes the payment, handles form submission, and manages payment status polling.
 * It also manages local UI state such as loading, errors, and processing status.
 */
function CheckoutPageMain({ setClientSecret, setPaymentUuid, clientSecret, paymentUuid }: Props) {
  const hasInitializedRef = useRef(false);
  const POLLING_DELAY_MS =
    process.env.NODE_ENV === 'test'
      ? 0
      : /* istanbul ignore next */ 2000;

  const { t } = useTranslation('checkout');
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  // Local UI state
  const [loadingInit, setLoadingInit] = useState<boolean>(true);
  const [errorInit, setErrorInit] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [errorPayment, setErrorPayment] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Cart store actions
  const clearCart = useCartStore((s) => s.clearCart);
  const lockCart = useCartStore((s) => s.lockCart);
  const unlockCart = useCartStore((s) => s.unlockCart);
  const cartId = useCartStore((s) => s.cartId);
  const token = useAuthStore((s) => s.authToken);
  const lang = useLanguageStore((s) => s.lang);

  const loadCart = useCartStore((s) => s.loadCart);

  // 1) Load cart if user is authenticated but cart not yet loaded
  useEffect(() => {
    if (token && !cartId) {
      loadCart().catch(err => logWarn('Checkout:load cart', err));
    }
  }, [token, cartId, loadCart]);

  // 2) Initialize payment once we have token & cartId
  useEffect(() => {
    if (!token) {
      setErrorInit(t('errors.not_authenticated'));
      setLoadingInit(false);
      navigate('/login?next=/checkout');
      return;
    }

    if (!cartId) {
      // Still waiting for cart
      setLoadingInit(true);
      return;
    }

    // Prevent double initialization
    // istanbul ignore if
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
          throw new Error('Unexpected response from server');
        }
      } catch (err: any) {
        logError('Checkout:create payment', err);
        if (axios.isAxiosError(err) && err.response) {
          const { data } = err.response;
          if (data.code) {
            setErrorInit(getErrorMessage(t, data.code));
          } else {
            setErrorInit(getErrorMessage(t, 'generic_error'));
          }
        } else {
          setErrorInit(getErrorMessage(t, 'network_error'));
        }
      } finally {
        setLoadingInit(false);
      }
    })();
  }, [token, cartId, lang, navigate, t, setClientSecret, setPaymentUuid]);

  // Handle form submit: confirm card payment & poll for status
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorPayment(null);

      // Lock the cart immediately
      lockCart();
      setProcessing(true);
      setStatusMessage(null);
      setPollingStatus(true);

      const cardElement = elements!.getElement(CardElement);
      if (!cardElement) {
        setErrorPayment(t('errors.no_card_element'));
        setProcessing(false);
        setPollingStatus(false);
        unlockCart();
        return;
      }

      try {
        // Confirm payment with Stripe
        const { error } = await stripe!.confirmCardPayment(
          clientSecret!,
          { payment_method: { card: cardElement } }
        );

        if (error) {
          logWarn('Stripe confirm error:', error);
          setErrorPayment(t('errors.card_error'));
          setProcessing(false);
          setPollingStatus(false);
          unlockCart();
          return;
        }

        // Poll the backend until payment succeeds or fails
        setStatusMessage(t('checkout.waiting_confirmation'));

        let finalStatus: string | null = null;
        while (true) {
          // Wait before next poll
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, POLLING_DELAY_MS));

          try {
            const { status, data } = await getPaymentStatus(paymentUuid!, token!);
            if (status !== 200 || !data) {
              throw new Error(`Unexpected polling response: ${status}`);
            }
            
            const ps = data.status.toLowerCase();
            if (ps === 'succeeded' || ps === 'paid') {
              finalStatus = 'paid';
              break;
            }

            if (['requires_payment_method','failed','canceled'].includes(ps)) {
              finalStatus = 'failed';
              break;
            }

          } catch (err: any) {
            logError('Polling payment status error:', err);
            if (axios.isAxiosError(err) && err.response?.status === 401) {
              setErrorPayment(t('errors.not_authenticated'));
              unlockCart();
              navigate('/login');
              return;
            }
            if (axios.isAxiosError(err) && err.response?.data?.code) {
              setErrorPayment(getErrorMessage(t, err.response.data.code));
            } else {
              setErrorPayment(getErrorMessage(t, 'network_error'));
            }
            unlockCart();
            break;
          }
        }

        // Handle final outcome
        if (finalStatus === 'paid') {
          setStatusMessage(t('checkout.payment_success'));
          unlockCart();
          try {
            await clearCart();
          } catch (clearErr) {
            logError('clearCart error after payment:', clearErr);
          }
          navigate('/confirmation', { state: { paymentUuid } });
          return;
        } else {
          setErrorPayment(t('errors.payment_failed'));
          setProcessing(false);
          setPollingStatus(false);
          unlockCart();
          return;
        }
      } catch (confirmErr: any) {
        logError('Checkout:confirmCardPayment error', confirmErr);
        setProcessing(false);
        setPollingStatus(false);
        unlockCart();
      }
    },
    [stripe, elements, clientSecret, paymentUuid, clearCart, navigate, t, token, lockCart, unlockCart],
  );

  // Ensure cart is unlocked if user leaves the page
  useEffect(() => {
    return () => {
      unlockCart();
    };
  }, [unlockCart]);

  // Show initialization errors
  if (errorInit) {
    return (
      <Box sx={{ p: 4 }}>
        <AlertMessage message={errorInit} severity="error" />
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => window.location.reload()}>
            {t('checkout.retry')}
          </Button>
          <Button sx={{ ml: 2 }} variant="outlined" onClick={() => navigate('/cart')}>
            {t('checkout.back_to_cart')}
          </Button>
        </Box>
      </Box>
    );
  }

  // Show loader while initializing
  if (!cartId || loadingInit || !stripe || !elements) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <OlympicLoader />
        <Typography sx={{ mt: 2 }}>{t('checkout.initializing')}</Typography>
      </Box>
    );
  }

  // Render payment form
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
        {t('checkout.title')}
      </Typography>

      {errorPayment && (
        <AlertMessage message={errorPayment} severity="error" />
      )}

      {pollingStatus && statusMessage && (
        <AlertMessage message={statusMessage} severity="info" />
      )}

      <Typography variant="body2" sx={{ mb: 1 }}>
        {t('checkout.card_number_label')}
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
            ? t('checkout.processing')
            : t('checkout.pay_button')}
        </Button>
        <Button
          variant="text"
          onClick={() => {
            unlockCart();
            navigate('/cart');
          }}
        >
          {t('checkout.cancel_payment')}
        </Button>
      </Box>
    </Card>
  );
}
