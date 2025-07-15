import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/useAuthStore';
import { useFreeTicket } from '../../hooks/useFreeTicket';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import { FilterField } from '../FilterField';
import { FilterRadios } from './../FilterRadios/FilterRadios';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { Box, Card, CardContent, Divider, Typography } from '@mui/material';
import OlympicLoader from '../OlympicLoader';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import type { User } from '../../types/user';
import { logError } from '../../utils/logger';
import type { Product } from '../../types/products';
import { formatDate } from '../../utils/format';

interface Props { 
  open: boolean;  // whether the modal is open
  onClose: () => void;  // callback to close the modal
  onRefresh: () => void;  // callback to refresh parent list after creation
}

/**
 * AdminTicketCreateModal component allows admins to create free tickets for users.
 * It fetches user and product details based on provided IDs, validates them,
 * and submits the ticket creation request.
 */
export function AdminTicketCreateModal({ open, onClose, onRefresh }: Props) {
  // do not render anything if modal is closed
  if (!open) return null
  const { t } = useTranslation('orders');
  const token = useAuthStore((state) => state.authToken);
  const { notify } = useCustomSnackbar();
  const freeTicket = useFreeTicket();

  // form state
  const [userId, setUserId] = useState<number | null>(null);
  const [productId, setProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [locale, setLocale] = useState<'fr'|'en'|'de'>('fr');
  const [saving, setSaving] = useState(false);

  // loading & error states for user & product lookups
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [errorUser, setErrorUser] = useState<string | null>(null);
  const [errorProduct, setErrorProduct] = useState<string | null>(null);

  // fetched entities
  const [user, setUser] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  // common headers for axios calls
  const headers = { Authorization: `Bearer ${token}`, 'Accept-Language': locale };

  // Fetch user details when userId changes
  useEffect(() => {
    if (userId !== null && userId > 0) {
      setErrorUser(null);
      setLoadingUser(true);
      setUser(null);

      axios.get<{ user: User }>(
        `${API_BASE_URL}/api/users/${userId}`,
        { headers }
      )
      .then(res => setUser(res.data.user))
      .catch(err => {
        logError('AdminTicketCreateModalUserDetails', err);
        setErrorUser(t('errors.user_not_found'));
      })
    } else {
      // reset if no valid userId
      setUser(null);
      setErrorUser(null);
      setLoadingUser(false);
    }
  }, [userId]);

  // Validate that fetched user has role 'user'
  useEffect(() => {
    if (!user?.email) return;

    axios.get(`${API_BASE_URL}/api/users?email=${encodeURIComponent(user.email)}`,
      { headers }
    )
    .then(res => {
      const usersList = res.data.data.users;
      if (Array.isArray(usersList) && usersList.length > 0) {
        const fetchedUser = usersList[0];
        if (fetchedUser.role !== 'user') {
          setErrorUser(t('errors.only_users_allowed'));
          setUser(null);
        } else {
          setErrorUser(null);
        }
      } else {
        setErrorUser(t('errors.user_not_found'));
        setUser(null);
      }
    })
    .catch(err => {
      logError('AdminTicketCreateModalUserCheck', err);
      setErrorUser(t('errors.user_not_found'));
      setUser(null);  
    })
    .finally(() => setLoadingUser(false));
  }, [user]);

  // Fetch product details when productId or locale changes
  useEffect(() => {
    if (productId !== null && productId > 0) {
      setErrorProduct(null);
      setLoadingProduct(true);
      setProduct(null);

      axios.get<{ data: Product }>(
        `${API_BASE_URL}/api/products/${productId}`,
        { headers }
      )
      .then(res => setProduct(res.data.data))
      .catch(err => {
        logError('AdminTicketCreateModalProductDetails', err);
        setErrorProduct(t('errors.product_not_found'));
      })
      .finally(() => setLoadingProduct(false));
    } else {
      setProduct(null);
      setErrorProduct(null);
    }
  }, [productId, locale]);

  // Submit handler to create the free ticket
  const handleSubmit = async () => {
    setSaving(true)
    const payload = {
      user_id: userId!,
      product_id: productId!,
      quantity,
      locale
    }
    const ok = await freeTicket(payload)
    setSaving(false)
    if (ok) {
      notify(t('freeTicket.success'), 'success');
      onRefresh()
      onClose()
    } else {
      notify(t('errors.save_failed'), 'error');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Modal Title */}
      <DialogTitle>
        {t('freeTicket.title')}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

  <FilterField
    type="number"
    label={t('freeTicket.userId')}
    value={userId != null ? String(userId) : ''}
    onChange={value => {
      const n = parseInt(value, 10)
      setUserId(Number.isNaN(n) ? null : n)
    }}
  />

  <FilterField
    type="number"
    label={t('freeTicket.productId')}
    value={productId != null ? String(productId) : ''}
    onChange={value => {
      const n = parseInt(value, 10)
      setProductId(Number.isNaN(n) ? null : n)
    }}
  />

  <FilterField
    type="number"
    label={t('freeTicket.quantity')}
    value={String(quantity)}
    onChange={value => {
      const n = parseInt(value, 10)
      setQuantity(Number.isNaN(n) ? 0 : n)
    }}
  />

  <FilterRadios<'fr'|'en'|'de'>
    legend={t('freeTicket.locale')}
    value={locale}
    options={[
      { value: 'fr', label: t('freeTicket.fr') },
      { value: 'en', label: t('freeTicket.en') },
      { value: 'de', label: t('freeTicket.de') },
    ]}
    onChange={setLocale}
  />

  <Divider />

  {/* Preview Section */}
  <Typography variant="body1">{t('freeTicket.previsualisation')}</Typography>

  <Box
    sx={{
      display: 'grid',
      gap: 2,
      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      pt: 1,
    }}
  >
    {/* Loading indicator */}
    {(loadingUser || loadingProduct) && (
      <Box sx={{ gridColumn: '1 / -1', textAlign: 'center' }}>
        <OlympicLoader />
      </Box>
    )}

    {/* Error messages */}  
    {errorUser && (
      <Box sx={{ gridColumn: '1 / -1' }} color="error.main">
        {errorUser}
      </Box>
    )}
    {errorProduct && (
      <Box sx={{ gridColumn: '1 / -1' }} color="error.main">
        {errorProduct}
      </Box>
    )}

    {/* User preview card */}
    {!loadingUser && !errorUser && user && (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            {t('freeTicket.user')}
          </Typography>
          <Typography sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{`${user.firstname} ${user.lastname}`}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {user.email}
          </Typography>
        </CardContent>
      </Card>
    )}

    {/* Product preview card */}
    {!loadingProduct && !errorProduct && product && (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            {t('freeTicket.product')}
          </Typography>
          <Typography variant='body1' sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere', mb: 1 }}>{product.name}</Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{t('freeTicket.productDetails')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{t('freeTicket.places', { count: product.product_details.places } )} </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {formatDate(product.product_details.date, locale)} - {product.product_details.time}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {product.product_details.location}
          </Typography>
          <Typography variant="body2" color={product.stock_quantity <= 0 ? "error.main" : "success"} sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere', mt: 1 }}>
            {t('freeTicket.stock', { quantity: product.stock_quantity })}
          </Typography>
        </CardContent>
      </Card>
    )}

    {/* Fallback when no details */}
    {!loadingUser &&
      !loadingProduct &&
      !errorUser &&
      !errorProduct &&
      !user &&
      !product && (
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Typography>{t('freeTicket.noDetails')}</Typography>
        </Box>
    )}
  </Box>
</DialogContent>

      <Divider />
      {/* Action buttons */}
      <DialogActions>
        <Button onClick={onClose}>{t('freeTicket.cancel')}</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={saving || !userId || !productId || quantity <= 0 || errorUser !== null || errorProduct !== null || quantity > (product?.stock_quantity ?? 0)}
          startIcon={ saving
            ? <CircularProgress color="inherit" size={16} />
            : undefined
          }
        >
          {saving ? t('freeTicket.creation') : t('freeTicket.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
