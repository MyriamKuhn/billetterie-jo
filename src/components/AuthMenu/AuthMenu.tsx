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
 * Composant AuthMenu
 * This component renders an authentication menu button and dropdown, 
 * adapting options based on user login state and role.
 * It includes options for login, registration,
 * password recovery, dashboard access, and logout.
 */
export default function AuthMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Retrieve auth token and role from store
  const authToken = useAuthStore((s) => s.authToken);
  const role = useAuthStore((s) => s.role);
  const clearAuthToken = useAuthStore((s) => s.clearToken);

  // Cart-related state to reset guest cart on logout
  const clearGuestCartIdInStore = useCartStore((s) => s.setGuestCartId);
  const loadCart = useCartStore((s) => s.loadCart);

  // Anchor element for menu positioning (null = closed)
  const [anchor, setAnchor] = React.useState<null|HTMLElement>(null);
  const openMenu  = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const closeMenu = () => setAnchor(null);

  // Handle user logout: clear state, reset cart, navigate to login
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

  // Filter navigation items based on auth state and user role
  const loginItems = navItems.filter(i => i.group==='login' && !authToken);
  const forgotPasswordItem = navItems.find(i => i.group === 'password' && !authToken);

  const dashboardItems = navItems.filter(i => i.group==='dashboard' && authToken && (i.role === 'all' || i.role === role));
  const authItems = navItems.filter(i => i.group==='auth' && authToken && (i.role === 'all' || i.role === role));

  const logoutItem = navItems.find(i => i.group === 'logout' && authToken);

  return (
    <>
      {/* Button that toggles the menu */}
      <Button
        onClick={openMenu}
        variant="outlined"
        color="primary"
        aria-haspopup="true"
        aria-expanded={anchor ? 'true' : undefined}
      >
        { authToken ? t('navbar.myAccount') : t('navbar.connection') }
      </Button>
    
      {/* Dropdown menu with conditional items */}
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {/* Login / Register options when logged out */}
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

        {/* Dashboard links for logged-in users */}
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

        {/* Forgot password link when logged out */}
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

        {/* Additional auth-related links for logged-in users */}
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

        {/* Logout option for logged-in users */}
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
