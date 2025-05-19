import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  Badge,
  Select,
  MenuItem,
  type SelectChangeEvent,
  useMediaQuery,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  ConfirmationNumber as TicketIcon,
  ShoppingCart,
  LightMode,
  DarkMode,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useCartStore } from '../../store/cartStore';
import logoSrc from '../../assets/jo_logo.png';
// 👇 Import du composant Flag
import Flag from 'react-world-flags';

interface NavbarProps {
  mode: 'light' | 'dark';
  toggleMode: () => void;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
}

export function Navbar({ mode, toggleMode, currentLang, onLanguageChange }: NavbarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const cartCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = () => setOpen(o => !o);
  const handleLangChange = (e: SelectChangeEvent) => onLanguageChange(e.target.value);

  // Liste des langues supportées
  const languages = [
    { lang: 'fr', country: 'FR', label: 'Français' },
    { lang: 'en', country: 'US', label: 'English' },
    { lang: 'de', country: 'DE', label: 'Deutsch' },
  ];

  return (
    <>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Toolbar variant="dense" sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton edge="start" onClick={toggleDrawer} aria-label="menu">
                <MenuIcon />
              </IconButton>
            )}
            <Box component="img" src={logoSrc} alt="Logo JO" sx={{ height: 32, mr: 1 }} />
            <Typography variant="h6" noWrap>
              Billetterie JO
            </Typography>
          </Box>

          {!isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button color="inherit" href="/">Accueil</Button>
              <Button color="inherit" href="/tickets">Billets</Button>

              {/* Sélecteur de langue avec drapeaux */}
              <Select
                value={currentLang}
                onChange={handleLangChange}
                size="small"
                renderValue={value => {
                  const cfg = languages.find(l => l.lang === value);
                  return cfg ? <Flag code={cfg.country} style={{ width: 24, height: 16 }} /> : null;
                }}
                sx={{ minWidth: 60 }}
              >
                {languages.map(({ lang, country, label }) => (
                  <MenuItem key={lang} value={lang}>
                    <Flag code={country} style={{ width: 24, height: 16, marginRight: 8 }} />
                    {label}
                  </MenuItem>
                ))}
              </Select>

              <IconButton color="inherit" href="/cart">
                <Badge badgeContent={cartCount} color="error">
                  <ShoppingCart />
                </Badge>
              </IconButton>

              <Button color="primary" variant="outlined" href="/login">Se connecter</Button>

              <IconButton color="inherit" onClick={toggleMode} aria-label="toggle theme">
                {mode === 'light' ? <DarkMode /> : <LightMode />}
              </IconButton>
            </Box>
          ) : (
            <IconButton color="inherit" onClick={toggleMode}>
              {mode === 'light' ? <DarkMode /> : <LightMode />}
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer mobile */}
      <Drawer anchor="left" open={open} onClose={toggleDrawer}>
        <List sx={{ width: 250 }}>
          <ListItemButton component="a" href="/">
            <ListItemIcon><HomeIcon /></ListItemIcon>
            <ListItemText primary="Accueil" />
          </ListItemButton>
          <ListItemButton component="a" href="/tickets">
            <ListItemIcon><TicketIcon /></ListItemIcon>
            <ListItemText primary="Billets" />
          </ListItemButton>

          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Langue</Typography>
            <Select
              value={currentLang}
              onChange={handleLangChange}
              size="small"
              renderValue={value => {
                const cfg = languages.find(l => l.lang === value);
                return cfg ? <Flag code={cfg.country} style={{ width: 24, height: 16 }} /> : null;
              }}
              sx={{ minWidth: 60 }}
            >
              {languages.map(({ lang, country, label }) => (
                <MenuItem key={lang} value={lang}>
                  <Flag code={country} style={{ width: 24, height: 16, marginRight: 8 }} />
                  {label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <ListItemButton component="a" href="/cart">
            <ListItemIcon>
              <Badge badgeContent={cartCount} color="error">
                <ShoppingCart />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Panier" />
          </ListItemButton>
          <ListItemButton component="a" href="/login">
            <ListItemIcon><LoginIcon /></ListItemIcon>
            <ListItemText primary="Se connecter" />
          </ListItemButton>
        </List>
      </Drawer>
    </>
  );
}
