import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useProductDetails } from '../../hooks/useProductDetails';
import OlympicLoader from './../OlympicLoader';
import { ErrorDisplay } from '../ErrorDisplay';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '../../utils/format';
import Chip from '@mui/material/Chip';
import { useCartStore, type CartItem } from '../../stores/cartStore';
import { closeSnackbar, useSnackbar } from 'notistack';

interface Props {
  open: boolean;
  productId: number | null;
  lang: string;
  onClose: () => void;
}

export function ProductDetailsModal({ open, productId, lang, onClose }: Props) {
  const modalContainer = typeof document !== 'undefined'
    ? document.getElementById('modal-root')
    : null;

  const { t } = useTranslation('ticket');
  const { enqueueSnackbar } = useSnackbar();

  const { product, loading, error } = useProductDetails(open ? productId : null, lang);

  const fmtCur = (v: number)   => formatCurrency(v, lang, 'EUR');
  const dateStr  = product ? formatDate(product.product_details.date, lang) : '';

  const soldOut = product?.stock_quantity === 0;
  const finalPrice = (product?.price ?? 0) * (1 - (product?.sale ?? 0));

  // on récupère le tableau items et la fonction addItem
  const addItem = useCartStore.getState().addItem;

  const handleBuy = async () => {
    if (!product) return;

    // Récupère le panier actuel pour calculer la quantité finale
    const existingItems = useCartStore.getState().items;
    const existing = existingItems.find(i => i.id === product.id.toString());
    const currentQty = existing?.quantity ?? 0;

    // On ajoute toujours la quantité finale (1 de plus)
    const newQty = currentQty + 1;

    const item: CartItem = {
      id: product.id.toString(),
      name: product.name,
      quantity: newQty,
      price: finalPrice,
      inStock: product.stock_quantity > 0,
      availableQuantity: product.stock_quantity,
    };
    try {
      await addItem(item);
      enqueueSnackbar(t('cart.add_success'), {
        variant: 'success',
        autoHideDuration: 2000,                     // plus court pour le succès
        action: key => (                            // bouton « Annuler »
          <Button color="inherit" size="small" onClick={() => closeSnackbar(key)}>
            {t('cart.undo')}
          </Button>
        ),
      });
    } catch (err: any) {
      if (err.message.includes('exceeds available')) {
        enqueueSnackbar(t('cart.not_enough_stock', { count: item.availableQuantity }), { variant: 'warning' });
      } else {
        enqueueSnackbar(t('cart.error_update'), { variant: 'error' });
      }
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      // @ts-ignore : MUI attend bien container et le passera au Modal en interne
      container={modalContainer!}
    >
      <DialogTitle>
        {loading ? t('tickets.loading') : error ? t('tickets.error') : product?.name}
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <OlympicLoader />
          </Box>
        )}

        {error && (
          <ErrorDisplay title={t('errors.title')} message={t('errors.not_found')} showRetry={false} showHome={false} />
        )}

        {product && (
          <Box component="div">
            <Box
              component="img"
              src={product.product_details.image}
              alt={product.name}
              loading="lazy"
              sx={{ width: '100%', height: 200, objectFit: 'cover', mb: 2 }}
            />

            <Typography variant="body1">
              {dateStr}{product.product_details.time && ` – ${product.product_details.time}`}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {product.product_details.location}
            </Typography>

            <Typography variant='body2' color="text.secondary" sx={{ mb: 1 }}>
              {t('tickets.category', { category: product.product_details.category })}
            </Typography>

            <Typography variant="body2" sx={{ mb: 1 }}>
              {product.product_details.description}
            </Typography>

            <Typography variant="body1" color="text.secondary">
              {t('tickets.places', { count: product.product_details.places })}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 , mt: 1 }}>
              {product.sale > 0 && (
                <Typography variant="body2" sx={{ textDecoration: 'line-through' }}>
                  {fmtCur(product.price)}
                </Typography>
              )}
              <Typography variant="subtitle1" fontWeight="bold">
                {fmtCur(finalPrice)}
              </Typography>
              {product.sale > 0 && <Chip label={`–${Math.round(product.sale*100)}%`} size="small" />}
            </Box>
            <Typography variant="body2" color={soldOut ? 'error.main' : 'text.secondary'} sx={{ mt:1 }}>
              { soldOut ? t('tickets.out_of_stock') : t('tickets.available', {count: product.stock_quantity}) }
            </Typography>
            </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('tickets.close')}</Button>
        <Button
          variant="contained"
          onClick={handleBuy}
          disabled={product?.stock_quantity === 0 || loading || !!error}
        >
          {soldOut ? t('tickets.out_of_stock') : t('tickets.buy')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

