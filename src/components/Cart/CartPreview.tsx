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
import { useCartStore, type CartItem } from '../../stores/cartStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';
import { useReloadCart } from '../../hooks/useReloadCart';
import { useStockChangeNotifier } from '../../hooks/useStockChangeNotifier';
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar';

export default function CartPreview() {
  const { t } = useTranslation(['common', 'cart']);
  const { notify } = useCustomSnackbar();
  const lang = useLanguageStore(s => s.lang);

  // Reload logic extracted
  const { loading, hasError, reload, isReloading } = useReloadCart();

  // Items from store
  const items = useCartStore(s => s.items) ?? [];
  useStockChangeNotifier(items, isReloading);
  const addItem = useCartStore.getState().addItem;

  // Popover state
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const id = open ? 'cart-popover' : undefined;

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  const handleOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    reload();
  }, [reload]);

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const adjustQty = useCallback(
    async (item: CartItem, delta: number) => {
      const newQty = Math.max(0, item.quantity + delta);
      if (newQty > item.availableQuantity) {
        notify(
          t('cart:cart.not_enough_stock', { count: item.availableQuantity }),
          'warning'
        );
        return;
      }
      try {
        await addItem({ ...item, quantity: newQty });
        if (delta > 0) {
        notify(
          t('cart:cart.add_success'),
          'success'
        );
        } else if (delta < 0) {
          notify(
            t('cart:cart.remove_success'), 
            'success'
          );
        } else {
          notify(
            t('cart:cart.update_success'), 
            'success'
          );
        }
      } catch {
        notify(
          t('cart:errors.error_update'),
          'error'
        );
      }
    },
    [addItem, notify, t]
  );

  return (
    <>
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
            {t('cart:cart.unavailable')}
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
                      <Tooltip title={t('cart:cart.remove_one')}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => adjustQty(item, -1)}
                            disabled={item.quantity <= 0 || loading}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Typography sx={{ mx: 0.5 }}>{item.quantity}</Typography>

                      <Tooltip
                        title={
                          item.quantity >= item.availableQuantity
                            ? t('cart:cart.max_reached', { count: item.availableQuantity })
                            : t('cart:cart.add_one')
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => adjustQty(item, +1)}
                            disabled={loading || item.quantity >= item.availableQuantity}
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