import React, { useState, useCallback } from 'react';
import IconButton    from '@mui/material/IconButton';
import Badge         from '@mui/material/Badge';
import Popover       from '@mui/material/Popover';
import List          from '@mui/material/List';
import ListItem      from '@mui/material/ListItem';
import ListItemText  from '@mui/material/ListItemText';
import Button        from '@mui/material/Button';
import Typography    from '@mui/material/Typography';
import Box           from '@mui/material/Box';
import Tooltip       from '@mui/material/Tooltip';
import OlympicLoader from '../OlympicLoader';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon       from '@mui/icons-material/Add';
import RemoveIcon    from '@mui/icons-material/Remove';
import { useCartStore, type CartItem } from '../../stores/useCartStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';
import { useReloadCart } from '../../hooks/useReloadCart';
import { useStockChangeNotifier } from '../../hooks/useStockChangeNotifier';
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar';
import { useAuthStore } from '../../stores/useAuthStore';

/**
 * CartPreview component displays a summary of the user's cart.
 * It shows the number of items, total price, and allows adjusting item quantities.
 * The cart can be opened in a popover for quick access.
 */
export default function CartPreview() {
  const { t } = useTranslation(['common', 'cart']);
  const { notify } = useCustomSnackbar();
  const lang = useLanguageStore(s => s.lang);
  const role = useAuthStore(s => s.role);

  // Reload logic for cart preview
  const { loading, hasError, reload, isReloading } = useReloadCart();

  // Cart items and state from store
  const items = useCartStore(s => s.items);
  useStockChangeNotifier(items, isReloading);
  const addItem = useCartStore.getState().addItem;
  const isLocked = useCartStore(s => s.isLocked);

  // Popover anchoring and open/close handlers
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const id = open ? 'cart-popover' : undefined;

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  const handleOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    reload();
  }, [reload]); // Refresh items when opening

  const handleClose = useCallback(() => setAnchorEl(null), []);

  // Adjust quantity with validation and notifications
  const adjustQty = useCallback(
    async (item: CartItem, delta: number) => {
      if (isLocked) {
        notify(t('cart:errors.cart_locked'), 'warning');
        return;
      }
      const newQty = Math.max(0, item.quantity + delta);
      if (newQty > item.availableQuantity) {
        notify(
          t('cart:cart.not_enough_stock', { count: item.availableQuantity }),
          'warning'
        );
        return;
      }
      try {
        await addItem(item.id, newQty, item.availableQuantity);
        if (delta > 0) {
        notify(
          t('cart:cart.add_success'),
          'success'
        );
        } else {
          notify(
            t('cart:cart.remove_success'), 
            'success'
          );
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

  return (
    <>
      {/* Cart icon button with badge */}
      <IconButton
        aria-describedby={id}
        onClick={handleOpen}
        color="inherit"
        aria-label={t('common:navbar.cart')}
      >
        <Badge
          badgeContent={cartCount}
          color="info"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <ShoppingCartIcon />
        </Badge>
      </IconButton>

      {/* Popover showing cart preview */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ '& .MuiPopover-paper': { width: 300, p: 1 } }}
      >
        {isLocked && (
          <Box sx={{ p: 1 }}>
            <Typography variant="body2" color="warning.main">
              {t('cart:cart.payment_in_progress')}
            </Typography>
          </Box>
        )}

        {/* Loading, error, admin restriction, empty, or items list */}
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <OlympicLoader />
          </Box>
        ) : hasError ? (
          <Typography sx={{ p: 2 }} variant="body2">
            {t('cart:cart.unavailable')}
          </Typography>
        ) : (role === 'admin' || role === 'employee') ? (
        <Typography sx={{ p: 2 }} variant="body2">
          {t('cart:cart.no_items_for_admin')}
        </Typography>
        ) : items.length === 0 ? (
          <Typography sx={{ p: 2 }} variant="body2">
            {t('cart:cart.empty')}
          </Typography>
        ) : (
          <Box>
            <List dense aria-live="polite">
              {items.map(item => (
                <ListItem
                  key={item.id}
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Tooltip title={isLocked ? t('cart:errors.cart_locked') : t('cart:cart.remove_one')}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => adjustQty(item, -1)}
                            disabled={loading || item.quantity <= 0}
                            sx={isLocked ? { opacity: 0.5 } : undefined}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      {/* Quantity display */}
                      <Typography sx={{ mx: 0.5 }}>{item.quantity}</Typography>
                      {/* Add one */}
                      <Tooltip
                        title={
                          isLocked
                            ? t('cart:errors.cart_locked')
                            : item.quantity >= item.availableQuantity
                              ? t('cart:cart.max_reached', { count: item.availableQuantity })
                              : t('cart:cart.add_one')
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => adjustQty(item, +1)}
                            disabled={loading || item.quantity >= item.availableQuantity}
                            sx={isLocked ? { opacity: 0.5 } : undefined}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
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
            {/* Total and view cart button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
              <Typography variant="subtitle1">
                {t('cart:cart.total')} : {formatCurrency(total, lang, 'EUR')}
              </Typography>
              <Button
                component={Link}
                to="/cart"
                variant="contained"
                size="small"
                onClick={handleClose}
                disabled={loading}
              >
                {t('cart:cart.view')}
              </Button>
            </Box>
          </Box>
        )}
      </Popover>
    </>
  );
}