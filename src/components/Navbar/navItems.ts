import HomeIcon from '@mui/icons-material/Home';
import TicketIcon from '@mui/icons-material/ConfirmationNumber';

interface NavItem { 
  key: string; 
  href: string; 
  icon: React.ComponentType; 
}

export const navItems: NavItem[] = [
  { key: 'home', href: '/', icon: HomeIcon },
  { key: 'tickets', href: '/tickets', icon: TicketIcon },
];