import React, { useEffect, useState } from 'react';
import IconButton    from '@mui/material/IconButton';
import Badge         from '@mui/material/Badge';
import Popover       from '@mui/material/Popover';
import List          from '@mui/material/List';
import ListItem      from '@mui/material/ListItem';
import ListItemText  from '@mui/material/ListItemText';
import Button        from '@mui/material/Button';
import Typography    from '@mui/material/Typography';
import Box           from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon       from '@mui/icons-material/Add';
import RemoveIcon    from '@mui/icons-material/Remove';

import { useCartStore } from '../../stores/cartStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { enqueueAddToCart } from '../../utils/cart';

function CartPreview() {
  const { t } = useTranslation();
  const lang     = useLanguageStore(s => s.lang);
  const items    = useCartStore(s => s.items) ?? [];
  const loadCart = useCartStore(s => s.loadCart);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [loading, setLoading]   = useState<boolean>(false);

  const open      = Boolean(anchorEl);
  const id        = open ? 'cart-popover' : undefined;
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Recharge le panier au montage **et** à chaque changement de langue
  useEffect(() => {
    setLoading(true);
    loadCart().finally(() => setLoading(false));
  }, [loadCart, lang]);

  const handleOpen  = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const adjustQty = (itemId: string, name: string, price: number, delta: number) => {
    const existing   = items.find(i => i.id === itemId);
    const currentQty = existing?.quantity ?? 0;
    const newQty     = Math.max(0, currentQty + delta);

    enqueueAddToCart({ id: itemId, name, quantity: newQty, price });
  };

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
        sx={{
          '& .MuiPopover-paper': {
            width: 300,
            p: 1,
          }
        }}
      >
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Box>
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
                        onClick={() => adjustQty(item.id, item.name, item.price, -1)}
                        disabled={item.quantity <= 0}
                        aria-label={t('cart.remove_one')}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ mx: 0.5 }}>{item.quantity}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => adjustQty(item.id, item.name, item.price, +1)}
                        aria-label={t('cart.add_one')}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={item.name}
                    secondary={`${item.price.toFixed(2)} €`}
                  />
                </ListItem>
              ))}
            </List>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
              <Typography variant="subtitle1">
                {t('cart.total')} :{' '}
                {items.reduce((sum, i) => sum + i.quantity * i.price, 0).toFixed(2)} €
              </Typography>
              <Button
                component={Link}
                to="/cart"
                variant="contained"
                size="small"
                onClick={handleClose}
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
