import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';

// Hoisted mocks
const mockNavigate = vi.fn();
const mockClearToken = vi.fn();
const mockSetGuestCartId = vi.fn();
const mockLoadCart = vi.fn();

// 1️⃣ Mock i18n
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key }),
}));

// 2️⃣ Mock router
vi.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
}));

// 3️⃣ Mock stores
vi.mock('../../stores/useAuthStore', () => ({
  __esModule: true,
  useAuthStore: (selector: any) => selector({
    authToken: null,
    role: 'user',
    clearToken: mockClearToken,
    remember: false,
    setToken: () => {},
  }),
}));
vi.mock('../../stores/useCartStore', () => ({
  __esModule: true,
  useCartStore: (selector: any) => selector({
    setGuestCartId: mockSetGuestCartId,
    loadCart: mockLoadCart,
  }),
}));

// 4️⃣ Mock auth helper
vi.mock('../../utils/authHelper', () => {
  const logout = vi.fn(() => Promise.resolve());
  return { __esModule: true, logout };
});

// 5️⃣ Mock navItems
vi.mock('../Navbar', () => ({
  __esModule: true,
  navItems: [
    // … tes items existants …
    { key: 'login',     group: 'login',     href: '/login',     icon: () => <span data-testid="icon-login" /> },
    { key: 'signup',    group: 'login',     href: '/signup',    icon: () => <span data-testid="icon-signup" /> },
    // **nouveau** mot de passe oublié
    { key: 'forgot',    group: 'password',  href: '/forgot',    icon: () => <span data-testid="icon-forgot" /> },
    { key: 'dashboard', group: 'dashboard', role: 'user', href: '/dashboard', icon: () => <span data-testid="icon-dashboard" /> },
    // **nouveau** profil/auth
    { key: 'profile',   group: 'auth',      role: 'user', href: '/profile',  icon: () => <span data-testid="icon-profile" /> },
    { key: 'logout',    group: 'logout',    icon: () => <span data-testid="icon-logout" /> },
  ],
}));

import AuthMenu from './AuthMenu';
import { logout as mockLogout } from '../../utils/authHelper';

describe('<AuthMenu /> logged out', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login/signup and navigates', async () => {
    render(<AuthMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'navbar.connection' }));

    // on vérifie l’affichage…
    expect(await screen.findByText('navbar.login')).toBeInTheDocument();
    expect(screen.getByText('navbar.signup')).toBeInTheDocument();

    // et on clique bien sur CHAQUE option
    fireEvent.click(screen.getByText('navbar.login'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');

    fireEvent.click(screen.getByText('navbar.signup'));
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });
});

describe('<AuthMenu /> logged in', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    // remock authenticated
    vi.doMock('../../stores/useAuthStore', () => ({
      __esModule: true,
      useAuthStore: (selector: any) => selector({
        authToken: 'tok',
        role: 'user',
        clearToken: mockClearToken,
        remember: false,
        setToken: () => {},
      }),
    }));
    vi.doMock('../../stores/useCartStore', () => ({
      __esModule: true,
      useCartStore: (selector: any) => selector({
        setGuestCartId: mockSetGuestCartId,
        loadCart: mockLoadCart,
      }),
    }));
    vi.doMock('../../utils/authHelper', () => ({
      __esModule: true,
      logout: mockLogout,
    }));
  });

  it('renders dashboard/logout and triggers logout', async () => {
    const { default: Reloaded } = await import('./AuthMenu');
    render(<Reloaded />);
    fireEvent.click(screen.getByRole('button', { name: 'navbar.myAccount' }));

    // on teste le clic sur Dashboard
    expect(await screen.findByText('navbar.dashboard')).toBeInTheDocument();
    fireEvent.click(screen.getByText('navbar.dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');

    // on teste ensuite le clic sur Logout
    expect(screen.getByText('navbar.logout')).toBeInTheDocument();
    fireEvent.click(screen.getByText('navbar.logout'));
    await waitFor(() =>
      expect(mockLogout).toHaveBeenCalledWith(
        mockClearToken,
        mockSetGuestCartId,
        mockLoadCart,
        mockNavigate,
        '/login'
      )
    );
  });

  it('renders forgot password option and navigates', async () => {
    render(<AuthMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'navbar.connection' }));
    expect(await screen.findByText('navbar.forgot')).toBeInTheDocument();
    expect(screen.getByTestId('icon-forgot')).toBeInTheDocument();
    fireEvent.click(screen.getByText('navbar.forgot'));
    expect(mockNavigate).toHaveBeenCalledWith('/forgot');
  });

  it('renders auth items when logged in and navigates', async () => {
    const { default: Reloaded } = await import('./AuthMenu');
    render(<Reloaded />);
    fireEvent.click(screen.getByRole('button', { name: 'navbar.myAccount' }));

    expect(await screen.findByText('navbar.profile')).toBeInTheDocument();
    fireEvent.click(screen.getByText('navbar.profile'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });
});


