import React from 'react';
import HomeIcon from '@mui/icons-material/Home';
import TicketIcon from '@mui/icons-material/ConfirmationNumber';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ReportIcon from '@mui/icons-material/BarChart';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LogoutIcon from '@mui/icons-material/Logout';
import LockResetIcon from '@mui/icons-material/LockReset';
import type { SvgIconProps } from '@mui/material/SvgIcon';

interface NavItem { 
  key: string; 
  href?: string; 
  icon: React.ComponentType<SvgIconProps>; 
  auth?: boolean;
  role: 'admin' | 'employee' | 'user' | 'all';
  group: 'public' |'login' | 'password' | 'dashboard' | 'auth' | 'logout';
}

export const navItems: NavItem[] = [
  // Public
  { key: 'home',      href: '/',                   icon: HomeIcon,      auth: false, role: 'all', group: 'public' },
  { key: 'tickets',   href: '/tickets',            icon: TicketIcon,    auth: false, role: 'all', group: 'public' },
  { key: 'login',     href: '/login',              icon: LoginIcon,     auth: false, role: 'all', group: 'login' },
  { key: 'signup',    href: '/signup',             icon: PersonAddIcon, auth: false, role: 'all', group: 'login' },
  { key: 'forgotPassword', href: '/forgot-password', icon: LockResetIcon, auth: false, role: 'all', group: 'password' },

  // Utilisateur authentifié
  { key: 'userDashboard',     href: '/user/dashboard',     icon: DashboardIcon, auth: true, role: 'user', group: 'dashboard' },
  { key: 'userOrders',        href: '/user/orders',        icon: ShoppingBagIcon, auth: true, role: 'user', group: 'auth' },
  { key: 'userTickets',       href: '/user/tickets',       icon: TicketIcon,      auth: true, role: 'user', group: 'auth' },
  { key: 'userInvoices',      href: '/user/invoices',      icon: ReceiptIcon,     auth: true, role: 'user', group: 'auth' },

  // Employé
  { key: 'employeeDashboard', href: '/employee/dashboard', icon: DashboardIcon, auth: true, role: 'employee', group: 'dashboard' },
  { key: 'manageTickets',     href: '/employee/tickets',   icon: TicketIcon,    auth: true, role: 'employee', group: 'auth' },

  // Admin
  { key: 'adminDashboard',  href: '/admin/dashboard',  icon: DashboardIcon, auth: true, role: 'admin', group: 'dashboard' },
  { key: 'manageUsers',     href: '/admin/users',      icon: PeopleIcon,    auth: true, role: 'admin', group: 'auth' },
  { key: 'manageTickets',   href: '/admin/tickets',    icon: TicketIcon,    auth: true, role: 'admin', group: 'auth' },
  { key: 'manageOrders',    href: '/admin/orders',     icon: ShoppingBagIcon, auth: true, role: 'admin', group: 'auth' },
  { key: 'managePayments',  href: '/admin/payments',   icon: ReceiptIcon,   auth: true, role: 'admin', group: 'auth' },
  { key: 'manageEmployees', href: '/admin/employees',  icon: PeopleIcon,    auth: true, role: 'admin', group: 'auth' },
  { key: 'reports',         href: '/admin/reports',    icon: ReportIcon,    auth: true, role: 'admin', group: 'auth' },

  // Déconnexion
  { key: 'logout', icon: LogoutIcon, auth: true, role: 'all', group: 'logout' }
];