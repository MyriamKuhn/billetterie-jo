import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCartStore } from '../../stores/useCartStore';
import { useNavigate } from 'react-router-dom';
import ActiveLink from '../ActiveLink';
import { navItems } from './navItems';
import { useTranslation } from 'react-i18next';
import { logout } from '../../utils/authHelper';

interface Props {
  isMobile: boolean;
  toggleDrawer?: () => void;
}

/**
 * Renders navigation links as a list: in mobile a drawer-style ListItemButtons with icons and text; in desktop a simple button row.
 */
export function NavLinkList({ isMobile, toggleDrawer }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Auth and cart stores for logout logic
  const clearAuthToken = useAuthStore((s) => s.clearToken);
  const clearGuestCartId = useCartStore((s) => s.setGuestCartId);
  const loadCart = useCartStore((s) => s.loadCart);

  const authToken = useAuthStore((s) => s.authToken);
  const role      = useAuthStore((s) => s.role);

  // Logout handler: clear stores, reload cart, navigate to login
  const handleLogout = async () => {
    toggleDrawer?.();
    await logout(
      clearAuthToken,
      clearGuestCartId,
      loadCart,
      navigate,
      '/login'
    );
  };

  // Filter nav items into sections
  const publicItems = navItems.filter(i => i.group==='public');
  const loginItems = navItems.filter(i => i.group==='login' && !authToken);
  const forgotPasswordItem = navItems.find(i => i.group === 'password' && !authToken);

  const dashboardItems = navItems.filter(i => i.group==='dashboard' && authToken && (i.role === 'all' || i.role === role));
  const authItems = navItems.filter(i => i.group==='auth' && authToken && (i.role === 'all' || i.role === role));

  const logoutItem = navItems.find(i => i.group === 'logout' && authToken);

  return (
    <List>
      {isMobile ? (
        /* ────────── MOBILE VIEW ────────── */
        <>
          {/* 1) Public links */}
          {publicItems.map((item) => {
            const Icon = item.icon;
            return (
              <ListItemButton
                key={item.key}
                component={ActiveLink}
                to={item.href!}
                onClick={toggleDrawer}
                aria-label={t(`navbar.${item.key}`)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t(`navbar.${item.key}`)} />
              </ListItemButton>
            );
          })}

          <Divider sx={{ my: 1 }} />

          {/* 2) Login/Signup when not authenticated */}
          {!authToken &&
            loginItems.map((item) => {
              const Icon = item.icon;
              return (
                <ListItemButton
                  key={item.key}
                  component={ActiveLink}
                  to={item.href!}
                  onClick={toggleDrawer}
                  aria-label={t(`navbar.${item.key}`)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}><Icon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={t(`navbar.${item.key}`)} />
                </ListItemButton>
              );
            })
          }

          {/* 3) Dashboard entry for authenticated users */}
          {authToken && 
            dashboardItems.map((item) => {
              const Icon = item.icon;
              return (
                <ListItemButton
                  key={item.key}
                  component={ActiveLink}
                  to={item.href!}
                  onClick={toggleDrawer}
                  aria-label={t(`navbar.${item.key}`)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={t(`navbar.${item.key}`)} />
                </ListItemButton>
              );
            })
          }

          <Divider sx={{ my: 1 }} />

          {/* 4) Forgot password link */}
          {!authToken && forgotPasswordItem && (
            <ListItemButton
              key={forgotPasswordItem.key}
              component={ActiveLink}
              to={forgotPasswordItem.href!}
              onClick={toggleDrawer}
              aria-label={t(`navbar.${forgotPasswordItem.key}`)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}><forgotPasswordItem.icon fontSize="small" /></ListItemIcon>
              <ListItemText primary={t(`navbar.${forgotPasswordItem.key}`)} />
            </ListItemButton>
          )}

          {/* 5) Authenticated action links */}
          {authToken &&
            authItems.map((item) => {
              const Icon = item.icon;
              return (
                <ListItemButton
                  key={item.key}
                  component={ActiveLink}
                  to={item.href!}
                  onClick={toggleDrawer}
                  aria-label={t(`navbar.${item.key}`)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={t(`navbar.${item.key}`)} />
                </ListItemButton>
              );
            })
          }

          {/* 6) Logout button */}
          {authToken && logoutItem && (
            <>
              <Divider sx={{ my: 1 }} />

              <ListItemButton onClick={handleLogout} aria-label={t(`navbar.${logoutItem.key}`)}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <logoutItem.icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t(`navbar.${logoutItem.key}`)} />
              </ListItemButton>
            </>
          )}
        </>
      ) : (
        /* ────────── DESKTOP VIEW ────────── */
        <>
          {/* Only show public items as buttons */}
          {publicItems.map((item) => (
            <Button
              key={item.key}
              component={ActiveLink}
              to={item.href!}
              color="inherit"
              aria-label={t(`navbar.${item.key}`)}
            >
              {t(`navbar.${item.key}`)}
            </Button>
          ))}
        </>
      )}
    </List>
  );
}
