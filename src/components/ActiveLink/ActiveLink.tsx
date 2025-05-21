import { NavLink, type NavLinkProps } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// Variante simple : un <NavLink> stylé
const StyledNavLink = styled(NavLink)(({ theme }) => ({
  color: theme.palette.text.primary,
  textDecoration: 'none',
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  '&.active': {
    backgroundColor: theme.palette.action.selected,
    fontWeight: theme.typography.fontWeightMedium,
  }
}));

export function ActiveLink(props: NavLinkProps) {
  // NavLink injecte automatiquement la class "active" quand la route matche
  return <StyledNavLink {...props} />;
}
