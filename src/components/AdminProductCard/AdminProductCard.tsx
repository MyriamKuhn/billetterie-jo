import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import type { Product } from '../../types/products';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '../../utils/format';
import { useMemo, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar';

interface Props {
  product: Product;
  lang: string;
  onViewDetails: (id: number) => void;
  onSave: (id: number, updates: {
    price: number;
    sale: number;
    stock_quantity: number;
  }) => Promise<boolean>;
  onRefresh: () => void;
  onDuplicate: (id: number) => void;
}

/**
 * Card component for managing a single product in the admin UI.
 *
 * - Displays product info (ID, name, date/time, location, places).
 * - Allows editing price, sale percentage, and stock quantity.
 * - Calculates and displays current vs. new prices with discount chips.
 * - Provides buttons to view details, duplicate, and save changes.
 */
export function AdminProductCard({ product: p, lang, onViewDetails, onSave, onRefresh, onDuplicate }: Props) {
  const { t } = useTranslation('adminProducts');
  const { notify } = useCustomSnackbar();

  // Local state for editable fields
  const [price, setPrice] = useState(p.price);
  const [sale, setSale] = useState(p.sale);
  const [salePercent, setSalePercent] = useState(p.sale * 100);
  const [stock, setStock] = useState(p.stock_quantity);
  const [saving, setSaving] = useState(false);

  // Compute the final price after discount
  const finalPrice = price * (1 - sale);

  // Determine if any field differs from its original value
  const isDirty = useMemo(() => {
    return (
      price !== p.price ||
      sale !== p.sale ||
      stock !== p.stock_quantity
    );
  }, [price, sale, stock, p]);

  /**
   * Save handler:
   * - Sets loading state
   * - Calls onSave with updated values
   * - On success, shows success snackbar and refreshes
   * - On failure, shows error snackbar
   */
  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(p.id, { price, sale, stock_quantity: stock });
    setSaving(false);
    if (ok) {
      notify(t('products.success'), 'success');
      onRefresh();
    } else {
      notify(t('errors.save_failed'), 'error');
    }
  };

  return (
    <Card sx={{ p:2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <CardContent>
        {/* Product title and ID */}
        <Typography variant="h6">ID {p.id} - {p.name}</Typography>
        {/* Event date and time */}
        <Typography variant="body2">
          {formatDate(p.product_details.date, lang)}{p.product_details.time && ` – ${p.product_details.time}`}
        </Typography>
        {/* Location and places available */}
        <Typography variant="body2" color="text.secondary">
          {p.product_details.location} - {t('products.places', { count: p.product_details.places })}
        </Typography>
      </CardContent>

      {/* Editable fields for price, sale %, and stock */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', px:2 }}>
        <TextField
          label={t('products.price')}
          type="number"
          value={price}
          onChange={e => setPrice(parseFloat(e.target.value))}
          size="small"
          slotProps={{
            input: {
              endAdornment: (
                <Chip label="€" size="small" />
              ),
            },
          }}          
        />
        <TextField
          label={t('products.sale')}
          type="number"
          value={salePercent}
          onChange={e => {
            const pct = parseFloat(e.target.value) || 0;
            setSalePercent(pct);
            setSale(pct / 100);
          }}
          slotProps={{
            input: {
              endAdornment: (
                <Chip label="%" size="small" />
              ),
            },
          }}          
          size="small"
        />
        <TextField
          label={t('products.stock')}
          type="number"
          value={stock}
          onChange={e => setStock(parseInt(e.target.value, 10))}
          size="small"
        />
      </Box>
      
      {/* Display current vs. new price with discount chips */}
      <Box sx={{ px:2, display:'flex', alignItems:'baseline', justifyContent: { xs: 'flex-start', md: 'space-between' }, flexDirection: { xs: 'column', md: 'row'}, gap:1 }}>
        {/* Current price section */}
        <Box sx={{ display: 'flex', alignItems: 'start', flexDirection: 'column' }}>
          <Typography variant="body2">
            {t('products.currentPrice')} :
          </Typography>
          {/* Strike through if there is an existing sale */}
          <Typography variant="body2" sx={{ textDecoration: p.sale>0 ? 'line-through' : 'none' }}>
            {formatCurrency(p.price, lang, 'EUR')}
          </Typography>
          {p.sale > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap : 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(p.price * (1 - p.sale), lang, 'EUR')}
              </Typography>
              {/* Existing sale percentage */}
              <Chip label={`–${Math.round(p.sale * 100)}%`} size="small" />
            </Box>
          )}
        </Box>
        {/* New price section */}
        <Box sx={{ display: 'flex', alignItems: 'start', flexDirection: 'column' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {t('products.newPrice')} :
          </Typography>
          {/* Strike through if new sale is applied */}
          <Typography variant="body2" sx={{ textDecoration: sale>0 ? 'line-through' : 'none' }}>
            {formatCurrency(price, lang, 'EUR')}
          </Typography>
          {sale > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap : 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {formatCurrency(finalPrice, lang, 'EUR')}
              </Typography>
              {/* New sale percentage */}
              <Chip label={`–${Math.round(sale * 100)}%`} size="small" />
            </Box>
          )}
        </Box>
      </Box>

      {/* Action buttons: view details, duplicate, save */}    
      <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: { xs: 'column', md: 'row'}, gap: 1, mt: 2 }}>
        <Button size="small" variant="outlined" onClick={() => onViewDetails(p.id)}>
          {t('products.updateDetails')}
        </Button>
        <Button size="small" variant="outlined" onClick={() => onDuplicate(p.id)}>
          {t('products.duplicate')}
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={saving || !isDirty}
          onClick={handleSave}
          startIcon={
            saving
              ? <CircularProgress color="inherit" size={16} />
              : undefined
          }
        >
          {saving ? t('products.saving') : t('products.save')}
        </Button>
      </Box>
    </Card>
  );
}
