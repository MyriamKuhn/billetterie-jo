import React from 'react';
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Box
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useCartStore } from '../../stores/cartStore';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function CartPreview() {
  const { t } = useTranslation();
  const items = useCartStore(s => s.items);
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const id = open ? 'cart-popover' : undefined;

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        aria-describedby={id}
        onClick={handleOpen}
        color="inherit"
        aria-label={t('navbar.cart')}
      >
        <Badge
          badgeContent={cartCount}
          color="info"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <ShoppingCart />
        </Badge>
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 300, p: 1 } }}
      >
        {cartCount === 0 ? (
          <Typography sx={{ p: 2 }} variant="body2">
            {t('cart.empty')}
          </Typography>
        ) : (
          <Box>
            <List dense>
              {items.map(item => (
                <ListItem key={item.id}>
                  <ListItemText
                    primary={item.name}
                    secondary={`${item.quantity} × ${item.price.toFixed(2)} €`}
                  />
                </ListItem>
              ))}
            </List>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
              <Typography variant="subtitle1">
                {t('cart.total')} : {items.reduce((sum, i) => sum + i.quantity * i.price, 0).toFixed(2)} €
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
