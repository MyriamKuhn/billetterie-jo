import React from 'react';
import {
  AppBar, Toolbar, IconButton, Box, Divider,
  Badge, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, useMediaQuery 
} from '@mui/material';
import {
  Menu as MenuIcon, ShoppingCart, Login as LoginIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../stores/cartStore';
import logoSrc from '../../assets/logo_arcs.png';
import logoParis from '../../assets/logo_paris.png';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ThemeToggle } from '../ThemeToggle';
import { NavLinkList } from './NavLinkList';
import { CartPreview } from '../Cart/CartPreview';
import { ActiveLink } from '../ActiveLink';
import { ActiveButton } from '../ActiveButton';

interface NavbarProps {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

export function Navbar({ mode, toggleMode }: NavbarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const cartCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = () => setOpen(o => !o);

  return (
    <>
      <AppBar position="fixed" color="inherit" elevation={0}
        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar variant="dense" sx={{ justifyContent: 'space-between' }}>

          {isMobile ? (
            // ────────── BARRE MOBILE ──────────
            <>
              {/* menu burger */}
              <IconButton edge="start" onClick={toggleDrawer} aria-label={t('navbar.menu')}>
                <MenuIcon />
              </IconButton>
          
              {/* logos centrés */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="img" src={logoSrc} alt={t('navbar.logoJO')} sx={{ height: 32 }} />
                <Box component="img" src={logoParis} alt={t('navbar.logoParis')} sx={{ height: 32 }} />
              </Box>

              {/* mini-panier */}
              <CartPreview />
            </>
          ) : (
            // ────────── BARRE DESKTOP ──────────
            <>
              {/* logos + nav principale */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
                  <Box component="img" src={logoSrc} alt={t('navbar.logoJO')} sx={{ height: 32 }} />
                  <Box component="img" src={logoParis} alt={t('navbar.logoParis')} sx={{ height: 32 }} />
                </Box>
                <NavLinkList isMobile={false} />
              </Box>

              {/* utilitaires */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ThemeToggle
                  mode={mode}
                  toggleMode={toggleMode}
                  aria-label={t('navbar.toggleTheme')}
                />
                <LanguageSwitcher />
                <ActiveButton to="/login" aria-label={t('navbar.login')}>
                  {t('navbar.login')}
                </ActiveButton>
                <CartPreview />
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* ────────── DRAWER MOBILE ────────── */}
      <Drawer anchor="left" open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 250, height: '100%', display: 'flex', flexDirection: 'column' }}>

          {/* En-tête logos centré */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, p: 2 }}>
            <Box component="img" src={logoSrc} alt={t('navbar.logoJO')} sx={{ height: 32 }} />
            <Box component="img" src={logoParis} alt={t('navbar.logoParis')} sx={{ height: 32 }} />
          </Box>

          {/* Liens principaux */}
          <List>
            <NavLinkList isMobile onNavigate={toggleDrawer} />

            <ListItemButton key="cart" component={ActiveLink} to="/cart" onClick={toggleDrawer} aria-label={t('navbar.cart')}>
                <ListItemIcon>
                  <Badge
                    badgeContent={cartCount}
                    color="info"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  >
                    <ShoppingCart />
                  </Badge>
                </ListItemIcon>
              <ListItemText primary={t('navbar.cart')} />
            </ListItemButton>

            <Divider sx={{ my: 1 }} />

            <ListItemButton key="login" component={ActiveLink} to="/login" onClick={toggleDrawer} aria-label={t('navbar.login')}>
              <ListItemIcon><LoginIcon /></ListItemIcon>
              <ListItemText primary={t('navbar.login')} />
            </ListItemButton>
          </List>

          {/* Pied de drawer : langue + thème */}
          <Box sx={{ mt: 'auto', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <LanguageSwitcher />
              <ThemeToggle
                mode={mode}
                toggleMode={toggleMode}
                aria-label={t('navbar.toggleTheme')}
              />
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
