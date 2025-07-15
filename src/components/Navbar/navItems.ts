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
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { SvgIconProps } from '@mui/material/SvgIcon';

// NavItem describes each entry in the navigation configuration
interface NavItem { 
  key: string; 
  href?: string; 
  icon: React.ComponentType<SvgIconProps>; 
  auth?: boolean;
  role: 'admin' | 'employee' | 'user' | 'all';
  group: 'public' |'login' | 'password' | 'dashboard' | 'auth' | 'logout';
}

/**
 * Defines the navigation items used throughout the app, including public links, authentication flows, and role-based dashboards.
 * Each item includes a key, optional href, icon component, authentication requirement, user role, and group categorization.
 */
export const navItems: NavItem[] = [
  // ────────── Public (no auth required) ──────────
  { key: 'home',      href: '/',                   icon: HomeIcon,      auth: false, role: 'all', group: 'public' },
  { key: 'tickets',   href: '/tickets',            icon: TicketIcon,    auth: false, role: 'all', group: 'public' },

  // ────────── Login / Signup ──────────
  { key: 'login',     href: '/login',              icon: LoginIcon,     auth: false, role: 'all', group: 'login' },
  { key: 'signup',    href: '/signup',             icon: PersonAddIcon, auth: false, role: 'all', group: 'login' },
  { key: 'forgotPassword', href: '/forgot-password', icon: LockResetIcon, auth: false, role: 'all', group: 'password' },

  // ────────── Authenticated User Dashboard ──────────
  { key: 'userDashboard',     href: '/user/dashboard',     icon: DashboardIcon, auth: true, role: 'user', group: 'dashboard' },
  { key: 'userOrders',        href: '/user/orders',        icon: ShoppingBagIcon, auth: true, role: 'user', group: 'auth' },
  { key: 'userTickets',       href: '/user/tickets',       icon: TicketIcon,      auth: true, role: 'user', group: 'auth' },

  // ────────── Employee Dashboard & Tools ──────────
  { key: 'employeeDashboard', href: '/employee/dashboard', icon: DashboardIcon, auth: true, role: 'employee', group: 'dashboard' },
  { key: 'scanTickets',     href: '/employee/scan',    icon: QrCodeScannerIcon,    auth: true, role: 'employee', group: 'auth' },
  { key: 'validateTickets', href: '/employee/validate', icon: CheckCircleIcon, auth: true, role: 'employee', group: 'auth' },

  // ────────── Admin Dashboard & Management ──────────
  { key: 'adminDashboard',  href: '/admin/dashboard',  icon: DashboardIcon, auth: true, role: 'admin', group: 'dashboard' },
  { key: 'manageUsers',     href: '/admin/users',      icon: PeopleIcon,    auth: true, role: 'admin', group: 'auth' },
  { key: 'manageTickets',   href: '/admin/tickets',    icon: TicketIcon,    auth: true, role: 'admin', group: 'auth' },
  { key: 'manageOrders',    href: '/admin/orders',     icon: ShoppingBagIcon, auth: true, role: 'admin', group: 'auth' },
  { key: 'managePayments',  href: '/admin/payments',   icon: ReceiptIcon,   auth: true, role: 'admin', group: 'auth' },
  { key: 'manageEmployees', href: '/admin/employees',  icon: PeopleIcon,    auth: true, role: 'admin', group: 'auth' },
  { key: 'reports',         href: '/admin/reports',    icon: ReportIcon,    auth: true, role: 'admin', group: 'auth' },

  // ────────── Logout ──────────
  { key: 'logout', icon: LogoutIcon, auth: true, role: 'all', group: 'logout' }
];