import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';

// ─── ❶ MOCK useMediaQuery ─────────────────────────────────────────────────────
vi.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: vi.fn(),
}));

// ─── ❷ MOCK IconButton ────────────────────────────────────────────────────────
vi.mock('@mui/material/IconButton', () => ({
  __esModule: true,
  default: (props: any) => <button data-testid="icon-button" {...props} />,
}));

// ─── ❸ MOCK des icônes MUI ────────────────────────────────────────────────────
vi.mock('@mui/icons-material/Menu', () => ({
  __esModule: true,
  default: () => <span data-testid="MenuIcon" />,
}));
vi.mock('@mui/icons-material/ShoppingCart', () => ({
  __esModule: true,
  default: () => <span data-testid="ShoppingCartIcon" />,
}));
vi.mock('@mui/icons-material/Login', () => ({
  __esModule: true,
  default: () => <span data-testid="LoginIcon" />,
}));

// ─── ❹ MOCK useTheme ─────────────────────────────────────────────────────────
vi.mock('@mui/material/styles', () => ({
  __esModule: true,
  useTheme: () => ({ breakpoints: { down: () => '' } }),
}));

// ─── ❺ MOCK react-i18next ────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (k: string) => k }),
}));

// ─── ❻ MOCK cartStore ────────────────────────────────────────────────────────
vi.mock('../../stores/cartStore', () => ({
  __esModule: true,
  useCartStore: (sel: any) => sel({ items: [{ id: '1', quantity: 2 }] }),
}));

// ─── ❼ MOCK du Drawer pour exposer data-testid="drawer" ───────────────────────
vi.mock('@mui/material/Drawer', () => ({
  __esModule: true,
  default: ({ open, onClose, children }: any) =>
    open ? (
      <div data-testid="drawer">
        <button data-testid="drawer-close" onClick={onClose} />
        {children}
      </div>
    ) : null,
}));

// ─── ❽ MOCK composants enfants ────────────────────────────────────────────────
vi.mock('../LanguageSwitcher', () => ({
  __esModule: true,
  default: () => <div data-testid="lang-switch" />,
}));
vi.mock('../ThemeToggle', () => ({
  __esModule: true,
  default: ({ mode, toggleMode, 'aria-label': aria }: any) => (
    <button data-testid="theme-toggle" data-mode={mode} aria-label={aria} onClick={toggleMode} />
  ),
}));
vi.mock('./NavLinkList', () => ({
  __esModule: true,
  NavLinkList: ({ isMobile }: any) => <nav data-testid={`navlist-${isMobile}`} />,
}));
vi.mock('../ActiveButton', () => ({
  __esModule: true,
  default: ({ to, 'aria-label': aria }: any) => (
    <button data-testid="active-button" data-to={to} aria-label={aria} />
  ),
}));
vi.mock('../ActiveLink', () => ({
  __esModule: true,
  default: ({ to, 'aria-label': aria }: any) => (
    <a data-testid="active-link" data-to={to} aria-label={aria} />
  ),
}));
// Et pour le lazy-loaded CartPreview :
vi.mock('../Cart/CartPreview', () => ({
  __esModule: true,
  default: () => <div data-testid="cart-preview" />,
}));

// ─── ❾ IMPORT du composant ────────────────────────────────────────────────────
import Navbar from './Navbar';
import useMediaQuery from '@mui/material/useMediaQuery';
const useMediaQueryMock = vi.mocked(useMediaQuery);

describe('<Navbar />', () => {
  const toggleModeMock = vi.fn();

  beforeEach(() => {
    cleanup();
    toggleModeMock.mockClear();
  });

  it('affiche la barre mobile et ouvre/ferme le drawer', async () => {
    useMediaQueryMock.mockReturnValue(true);
    render(<Navbar mode="light" toggleMode={toggleModeMock} />);

    // 1) Bouton menu et icône
    const menuBtn = screen.getByTestId('icon-button');
    expect(menuBtn).toHaveAttribute('aria-label', 'navbar.menu');
    expect(screen.getByTestId('MenuIcon')).toBeInTheDocument();

    // 2) On attend le CartPreview lazy
    expect(await screen.findByTestId('cart-preview')).toBeInTheDocument();

    // 3) Le drawer est fermé au départ
    expect(screen.queryByTestId('drawer')).toBeNull();

    // 4) Ouvre le drawer
    fireEvent.click(menuBtn);
    expect(screen.getByTestId('drawer')).toBeInTheDocument();
    expect(screen.getByTestId('navlist-true')).toBeInTheDocument();

    // 5) Ferme le drawer
    fireEvent.click(screen.getByTestId('drawer-close'));
    expect(screen.queryByTestId('drawer')).toBeNull();
  });

  it('affiche la barre desktop avec tous les utilitaires', async () => {
    useMediaQueryMock.mockReturnValue(false);
    render(<Navbar mode="dark" toggleMode={toggleModeMock} />);

    // NavLinkList desktop
    expect(screen.getByTestId('navlist-false')).toBeInTheDocument();

    // ThemeToggle
    const themeBtn = screen.getByTestId('theme-toggle');
    expect(themeBtn).toHaveAttribute('data-mode', 'dark');
    fireEvent.click(themeBtn);
    expect(toggleModeMock).toHaveBeenCalled();

    // LanguageSwitcher
    expect(screen.getByTestId('lang-switch')).toBeInTheDocument();

    // ActiveButton pour login
    const loginBtn = screen.getByTestId('active-button');
    expect(loginBtn).toHaveAttribute('data-to', '/login');
    expect(loginBtn).toHaveAttribute('aria-label', 'navbar.login');

    // Un seul CartPreview
    const carts = await screen.findAllByTestId('cart-preview');
    expect(carts).toHaveLength(1);
  });
});
