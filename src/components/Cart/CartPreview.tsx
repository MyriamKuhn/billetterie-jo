import React, { useEffect, useState, useCallback } from 'react';
import IconButton    from '@mui/material/IconButton';
import Badge         from '@mui/material/Badge';
import Popover       from '@mui/material/Popover';
import List          from '@mui/material/List';
import ListItem      from '@mui/material/ListItem';
import ListItemText  from '@mui/material/ListItemText';
import Button        from '@mui/material/Button';
import Typography    from '@mui/material/Typography';
import Box           from '@mui/material/Box';
import OlympicLoader from '../OlympicLoader';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon       from '@mui/icons-material/Add';
import RemoveIcon    from '@mui/icons-material/Remove';
import { useCartStore, type CartItem } from '../../stores/cartStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';
import { useSnackbar } from 'notistack';

function CartPreview() {
  // pour détecter et notifier les changements de quantité suite à un reload
  const prevItemsRef = React.useRef<CartItem[]>([]);
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const lang     = useLanguageStore(s => s.lang);
  const items    = useCartStore(s => s.items) ?? [];
  const loadCart = useCartStore(s => s.loadCart);
  const addItem  = useCartStore.getState().addItem;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [loading, setLoading]   = useState<boolean>(false);
  const [hasError, setHasError] = useState(false);

  const open      = Boolean(anchorEl);

  // après chaque update d'items, détecter réduction de stock côté serveur
  useEffect(() => {
    prevItemsRef.current.forEach(prev => {
      const cur = items.find(i => i.id === prev.id);
      if (cur) {
        if (cur.quantity < prev.quantity) {
          enqueueSnackbar(
            t('cart.quantity_reduced', { name: cur.name, count: cur.quantity }),
            { variant: 'warning' }
          );
        }
      } else {
        // article supprimé du panier (plus en stock)
        enqueueSnackbar(
          t('cart.removed_unavailable', { name: prev.name }),
          { variant: 'warning' }
        );
      }
    });
    prevItemsRef.current = items;
  }, [items, enqueueSnackbar, t]);

  const id = open ? 'cart-popover' : undefined;
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Recharge le panier au montage **et** à chaque changement de langue
  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      setHasError(false);
      try {
        await loadCart();
      } catch (err) {
        setHasError(true);
        enqueueSnackbar(t('cart.error_load'), { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [loadCart, lang, t, enqueueSnackbar]);

  const handleOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    // Rechargement à chaque ouverture
    setLoading(true);
    setHasError(false);
    loadCart()
      .catch(() => {
        setHasError(true);
        enqueueSnackbar(t('cart.error_load'), { variant: 'error' });
      })
      .finally(() => setLoading(false));
  }, [loadCart, enqueueSnackbar, t]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

    const adjustQty = useCallback(async (item: CartItem, delta: number) => {
      setLoading(true);
      const newQty = Math.max(0, item.quantity + delta);
      try {
        // Vérification de la quantité maximale
        if (item.availableQuantity !== undefined && newQty > item.availableQuantity) {
          enqueueSnackbar(
            t('cart.not_enough_stock', { count: item.availableQuantity }),
            { variant: 'warning' }
          );
        } else {
          await addItem({ ...item, quantity: newQty });
          enqueueSnackbar(t('cart.add_success'), { variant: 'success' });
        }
      } catch (err) {
        enqueueSnackbar(t('cart.error_update'), { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }, [addItem, t, enqueueSnackbar]);

  const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  return (
    <>
      <IconButton
        aria-describedby={id}
        onClick={handleOpen}
        color="inherit"
        aria-label={t('navbar.cart')}
      >
        <Badge badgeContent={cartCount} color="info" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <ShoppingCartIcon />
        </Badge>
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ '& .MuiPopover-paper': { width: 300, p: 1 } }}
      >
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <OlympicLoader />
          </Box>
        ) : hasError ? (
          <Typography sx={{ p: 2 }} variant="body2">
            {t('cart.unavailable')}
          </Typography>
        ) : cartCount === 0 ? (
          <Typography sx={{ p: 2 }} variant="body2">
            {t('cart.empty')}
          </Typography>
        ) : (
          <Box>
            <List dense>
              {items.map(item => (
                <ListItem
                  key={item.id}
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => adjustQty(item, -1)}
                        disabled={item.quantity <= 0 || loading}
                        aria-label={t('cart.remove_one')}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ mx: 0.5 }}>{item.quantity}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => adjustQty(item, +1)}
                        disabled={
                          loading ||
                          (item.availableQuantity !== undefined && item.quantity >= item.availableQuantity)
                        }
                        aria-label={t('cart.add_one')}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={item.name}
                    secondary={formatCurrency(item.price, lang, 'EUR')}
                  />
                </ListItem>
              ))}
            </List>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
              <Typography variant="subtitle1">
                {t('cart.total')} :{' '}
                {formatCurrency(total, lang, 'EUR')}
              </Typography>
              <Button
                component={Link}
                to="/cart"
                variant="contained"
                size="small"
                onClick={handleClose}
                disabled={loading}
              >
                {t('cart.view')}
              </Button>
            </Box>
          </Box>
        )}
      </Popover>
    </>
  );
}

export default CartPreview;
