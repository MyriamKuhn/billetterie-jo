import React, { Suspense } from 'react';
import AppBar           from '@mui/material/AppBar';
import Toolbar          from '@mui/material/Toolbar';
import IconButton       from '@mui/material/IconButton';
import Box              from '@mui/material/Box';
import Drawer           from '@mui/material/Drawer';
import useMediaQuery    from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';
import MenuIcon         from '@mui/icons-material/Menu';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { NavLinkList } from './NavLinkList';
import logoSrc from '../../assets/logos/logo_arcs.png';
import logoParis from '../../assets/logos/logo_paris.png';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeToggle from '../ThemeToggle';
import AuthMenu from '../AuthMenu/AuthMenu';

const CartPreview = React.lazy(() => import('../CartPreview/CartPreview'));

interface NavbarProps {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

function Navbar({ mode, toggleMode }: NavbarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ─── État du drawer mobile ───────────────────────────────────────────────
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

              <Suspense fallback={<CircularProgress size={24} />}>
                <CartPreview />
              </Suspense>
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
                <AuthMenu />
                <Suspense fallback={<CircularProgress size={24} />}>
                  <CartPreview />
                </Suspense>
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
          <NavLinkList isMobile toggleDrawer={toggleDrawer} />

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

export default Navbar;
