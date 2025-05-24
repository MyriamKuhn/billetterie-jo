import Button           from '@mui/material/Button';
import ListItemButton   from '@mui/material/ListItemButton';
import ListItemIcon     from '@mui/material/ListItemIcon';
import ListItemText     from '@mui/material/ListItemText';

import ActiveLink from '../ActiveLink';
import { navItems } from './navItems';
import { useTranslation } from 'react-i18next';

interface Props {
  isMobile: boolean;
  onNavigate?: () => void; // pour fermer le drawer mobile
}

export function NavLinkList({ isMobile, onNavigate }: Props) {
  const { t } = useTranslation();

  return (
    <>
      {navItems.map(({ key, href, icon: Icon }) =>
        isMobile ? (
          <ListItemButton
            key={key}
            component={ActiveLink}
            to={href}
            onClick={() => onNavigate?.()}
          >
            <ListItemIcon><Icon/></ListItemIcon>
            <ListItemText primary={t(`navbar.${key}`)} />
          </ListItemButton>
        ) : (
          <Button
            key={key}
            component={ActiveLink}
            to={href}
            color="inherit"
          >
            {t(`navbar.${key}`)}
          </Button>
        )
      )}
    </>
  );
}