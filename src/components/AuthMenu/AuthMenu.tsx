import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCartStore } from '../../stores/useCartStore';
import { logout } from '../../utils/authHelper';
import { navItems } from '../Navbar';

/**
 * <AuthMenu variant="desktop" /> affichera un seul bouton (profile icon) ouvrant
 * un menu déroulant “Mon compte” ou “Connexion/Inscription”. 
 * 
 * <AuthMenu variant="mobile" /> affichera, pour un utilisateur non connecté, un bouton
 * “Compte” ouvrant un menu déroulant “Se connecter” + “S’inscrire” + “Mot de passe oublié”.
 * S’il est connecté, affichera directement un bouton “Se déconnecter”.
 */
export default function AuthMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Récupération des informations d’authentification depuis le store
  const authToken = useAuthStore((s) => s.authToken);
  const role = useAuthStore((s) => s.role);
  const clearAuthToken = useAuthStore((s) => s.clearToken);
  const clearGuestCartIdInStore = useCartStore((s) => s.setGuestCartId);
  const loadCart = useCartStore((s) => s.loadCart);

  // State pour ancrer le menu (desktop ou mobile)
  const [anchor, setAnchor] = React.useState<null|HTMLElement>(null);
  const openMenu  = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const closeMenu = () => setAnchor(null);

  // Quand l’utilisateur clique sur “Se déconnecter”
  const handleLogout = async () => {
    closeMenu();
    await logout(
      clearAuthToken,
      clearGuestCartIdInStore,
      loadCart,
      navigate,
      '/login'
    );
  };

  // Filtrer les items 
  const loginItems = navItems.filter(i => i.group==='login' && !authToken);
  const forgotPasswordItem = navItems.find(i => i.group === 'password' && !authToken);

  const dashboardItems = navItems.filter(i => i.group==='dashboard' && authToken && (i.role === 'all' || i.role === role));
  const authItems = navItems.filter(i => i.group==='auth' && authToken && (i.role === 'all' || i.role === role));

  const logoutItem = navItems.find(i => i.group === 'logout' && authToken);

  return (
    <>
      <Button
        onClick={openMenu}
        variant="outlined"
        color="primary"
        aria-haspopup="true"
        aria-expanded={anchor ? 'true' : undefined}
      >
        { authToken ? t('navbar.myAccount') : t('navbar.connection') }
      </Button>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {/* 1) connexion / inscription */}
        {!authToken &&
          loginItems.map(item => {
            const Icon = item.icon;
            return (
              <MenuItem
                key={item.key}
                onClick={() => {
                  closeMenu();
                  navigate(item.href!);
                }}
              >
                <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
                {t(`navbar.${item.key}`)}
              </MenuItem>
            );  
          })
        }

        {/* 2) Dashboard, User, Employee, Admin */}
        {authToken && dashboardItems.map(item => {
          const Icon = item.icon;
          return (
            <MenuItem
              key={item.key}
              onClick={() => {
                closeMenu();
                navigate(item.href!);
              }}
            >
              <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
              {t(`navbar.${item.key}`)}
            </MenuItem>
          );
        })}

        <Divider sx={{ my: 1 }} />

        {/* 2) mot de passe oublié */}
        {!authToken && forgotPasswordItem && (
          <MenuItem
            key={forgotPasswordItem.key}
            onClick={() => {
              closeMenu();
              navigate(forgotPasswordItem.href!);
            }}
          >
            <ListItemIcon><forgotPasswordItem.icon fontSize="small" /></ListItemIcon>
            {t(`navbar.${forgotPasswordItem.key}`)}
          </MenuItem>
        )}

        {/* 3) Auth */}
        {authToken && authItems.map(item => {
          const Icon = item.icon;
          return (
            <MenuItem
              key={item.key}
              onClick={() => {
                closeMenu();
                navigate(item.href!);
              }}
            >
              <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
              {t(`navbar.${item.key}`)}
            </MenuItem>
          );
        })}

        {/* 3) Logout */}
        {authToken && logoutItem && [
          <Divider key="logout-divider" sx={{ my: 1 }} />,

          <MenuItem key="logout-item" onClick={handleLogout}>
            <ListItemIcon><logoutItem.icon fontSize="small" /></ListItemIcon>
            {t(`navbar.${logoutItem.key}`)}
          </MenuItem>
        ]}

      </Menu>
    </>
  );
}
