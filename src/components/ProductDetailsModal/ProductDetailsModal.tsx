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
import { useCartStore } from '../../stores/useCartStore';
import { useAddToCart } from '../../hooks/useAddToCart';
import { API_BASE_URL } from '../../config';
import placeholderImg from '../../assets/products/placeholder.png';

interface Props {
  open: boolean;
  productId: number | null;
  lang: string;
  onClose: () => void;
}

export function ProductDetailsModal({ open, productId, lang, onClose }: Props) {
  const { t } = useTranslation(['ticket', 'cart']);
  const cartItems = useCartStore(s => s.items);
  const addToCart = useAddToCart();

  const { product, loading, error } = useProductDetails(open ? productId : null, lang);

  const titleId = 'product-title';

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <OlympicLoader />
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !product) {
    return (
      <Dialog open={open} onClose={onClose}>
        <ErrorDisplay
          title={t('ticket:errors.title')}
          message={t('ticket:errors.not_found')}
          showRetry={false}
          showHome={false}
        />
      </Dialog>
    );
  }

  const fmtCur = (v: number)   => formatCurrency(v, lang, 'EUR');
  const dateStr  = formatDate(product.product_details.date, lang);

  const soldOut = product.stock_quantity === 0;
  const finalPrice = (product.price) * (1 - (product.sale));

  const handleBuy = async () => {
    const existing = cartItems.find(i => i.id === product.id.toString());
    const newQty = (existing?.quantity ?? 0) + 1;

    const ok = await addToCart(
      product.id.toString(),
      newQty,
      product.stock_quantity
    );
    if (ok) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId}>
        {product.name}
      </DialogTitle>

      <DialogContent dividers>
        {product && (
          <Box component="div">
            <Box
              component="img"
              src={
                product.product_details.image
                  ? `${API_BASE_URL}/products/images/${product.product_details.image}`
                  : placeholderImg
              }
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
              {t('ticket:tickets.places', { count: product.product_details.places })}
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
              { soldOut ? t('ticket:tickets.out_of_stock') : t('ticket:tickets.available', {count: product.stock_quantity}) }
            </Typography>
            </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('ticket:tickets.close')}</Button>
        <Button
          variant="contained"
          onClick={handleBuy}
          disabled={soldOut}
        >
          {soldOut ? t('ticket:tickets.out_of_stock') : t('ticket:tickets.buy')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

