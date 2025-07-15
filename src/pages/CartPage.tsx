import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';
import OlympicLoader from '../components/OlympicLoader';
import Seo from '../components/Seo';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../stores/useLanguageStore';
import { useCartStore, type CartItem } from '../stores/useCartStore';
import { useReloadCart } from '../hooks/useReloadCart';
import { useAuthStore } from '../stores/useAuthStore';
import { useCustomSnackbar } from '../hooks/useCustomSnackbar';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { CartItemDisplay } from '../components/CartItemDisplay';
import { CartSummary } from '../components/CartSummary';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/PageWrapper';

/**
 * CartPage component displays the user's shopping cart.
 * It allows users to view, update quantities, and proceed to checkout.
 */
export default function CartPage() {
  const { t } = useTranslation(['cart', 'common']);
  const lang = useLanguageStore((s) => s.lang);
  const navigate = useNavigate();

  // ── Hooks / store / snackbar setup ─────────────────────────────────────────
  const { loading, hasError, reload } = useReloadCart();
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore.getState().addItem;
  const isLocked = useCartStore(s => s.isLocked);
  const { notify } = useCustomSnackbar();
  const token = useAuthStore(s => s.authToken);

  // Terms acceptance state
  const [acceptedCGV, setAcceptedCGV] = useState(false);

  // Compute total amount, memoized to avoid unnecessary recalculation
  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    [items]
  );

  // Reload cart on mount and when language changes
  useEffect(() => {
    reload();
  }, [reload, lang]);

  // Detect mobile layout (<600px)
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Adjust quantity of an item
  const adjustQty = useCallback(
    async (item: CartItem, newQty: number) => {
      if (isLocked) {
        notify(t('cart:errors.cart_locked'), 'warning');
        return;
      }
      // Clamp to valid range
      if (newQty < 0) newQty = 0;
      if (newQty > item.availableQuantity) {
        notify(t('cart:cart.not_enough_stock', { count: item.availableQuantity }), 'warning');
        return;
      }
      try {
        await addItem(item.id, newQty, item.availableQuantity);
        if (newQty > item.quantity) {
          notify(t('cart:cart.add_success'), 'success');
        } else if (newQty < item.quantity) {
          notify(t('cart:cart.remove_success'), 'success');
        } else {
          notify(t('cart:cart.update_success'), 'info');
        }
      } catch (err: any) {
        if (err.message === 'CartLocked') {
          notify(t('cart:errors.cart_locked'), 'warning');
        } else {
          notify(t('cart:errors.error_update'), 'error');
        }
      }
    },
    [addItem, notify, t, isLocked]
  );

  // Handle "Pay" button click
  const handlePay = () => {
    if (isLocked) {
      notify(t('cart:errors.cart_locked'), 'warning');
      return;
    }
    if (!acceptedCGV) {
      notify(t('cart:cart.cgv_not_accepted'), 'warning');
      return;
    }
    if (!token) {
      // Redirect to login with return to cart
      navigate('/login?next=/cart');
      return;
    }
    navigate('/checkout');
  };

  // ── Loading / error / empty cart states ────────────────────────────────────
  if (loading) {
    return (
      <>
        <Seo title={t('cart:seo.title')} description={t('cart:seo.description')} />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <OlympicLoader />
        </Box>
      </>
    );
  }

  if (hasError) {
    return (
      <PageWrapper>
        <ErrorDisplay
          title={t('cart:errors.error_loading')}
          message={t('cart:errors.error_loading_message')} 
          showRetry={true}
          retryButtonText={t('common:errors.retry')}
          onRetry={reload}
          showHome={true}
          homeButtonText={t('common:errors.home')}
        />
      </PageWrapper>
    );
  }

  if (items.length === 0) {
    return (
      <PageWrapper>
        <ErrorDisplay
          title={t('cart:cart.empty')}               
          message={t('cart:errors.empty_message')}     
          showRetry={false}                     
          showHome={true}                       
          homeButtonText={t('common:errors.home')}  
        />
      </PageWrapper>
    );
  }

  // Banner displayed when cart is locked (payment in progress)
  const renderLockBanner = () => (
    isLocked ? (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="warning.main">
          {t('cart:cart.payment_in_progress')}
        </Typography>
      </Box>
    ) : null
  );

  // ── Desktop/tablet view: table layout ─────────────────────────────────────
  const renderTable = () => (
    <TableContainer
      component={Paper}
      sx={{
        mb: 3,
        overflowX: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('cart:table.product')}</TableCell>
            <TableCell align="right">{t('cart:table.unit_price')}</TableCell>
            <TableCell align="center">{t('cart:table.quantity')}</TableCell>
            <TableCell align="right">{t('cart:cart.total')}</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {items.map((item) => (
            <CartItemDisplay
              key={item.id}
              item={item}
              lang={lang}
              adjustQty={adjustQty}
              isMobile={false}
              disabled={isLocked}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );


  // ── Mobile view: card layout ───────────────────────────────────────────────
  const renderCards = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
      {items.map((item) => (
        <CartItemDisplay
          key={item.id}
          item={item}
          lang={lang}
          adjustQty={adjustQty}
          isMobile={true}
          disabled={isLocked}
        />
      ))}
    </Box>
  );

  // ── Final render ───────────────────────────────────────────────────────────
  return (
    <>
      <Seo title={t('cart:seo.title')} description={t('cart:seo.description')} />
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" gutterBottom>
          {t('cart:cart.title')}
        </Typography>

        {renderLockBanner()}

        {isMobile ? renderCards() : renderTable()}

        <CartSummary
          total={total}
          acceptedCGV={acceptedCGV}
          onCgvChange={checked => setAcceptedCGV(checked)}
          onPay={handlePay}
          lang={lang}
          isMobile={isMobile}
          disabled={isLocked}
        />

      </Box>
    </>
  );
}
