import { NavLink, type NavLinkProps } from 'react-router-dom';
import { styled } from '@mui/material/styles';

/**
 * A styled NavLink that applies MUI theme colors and spacing,
 * and highlights when active.
 */
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

/**
 * Wraps react-router’s NavLink with our styled version.
 * NavLink will add the "active" class when the route matches.
 */
function ActiveLink(props: NavLinkProps) {
  return <StyledNavLink {...props} />;
}

export default ActiveLink;