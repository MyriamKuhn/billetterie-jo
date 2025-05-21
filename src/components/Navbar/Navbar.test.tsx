import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';

// ❶ MOCK DES ICONS MATERIAL
vi.mock('@mui/icons-material', () => ({
  __esModule: true,
  Menu:          () => <span data-testid="icon-menu" />,
  ShoppingCart:  () => <span data-testid="icon-cart" />,
  Login:         () => <span data-testid="icon-login" />,
}));

// ❷ MOCK DE MUI
vi.mock('@mui/material', () => {
  // on crée le mock à l'intérieur pour qu'il soit visible dans la factory
  const useMediaQuery = vi.fn();
  return {
    __esModule: true,
    AppBar:        (p: any) => <div data-testid="appbar" {...p} />,
    Toolbar:       (p: any) => <div data-testid="toolbar" {...p} />,
    IconButton:    (p: any) => <button data-testid="icon-button" {...p} />,
    Box:           (p: any) => <div data-testid="box" {...p}>{p.children}</div>,
    Divider:       (p: any) => <hr data-testid="divider" {...p} />,
    Badge:         ({ badgeContent, children }: any) => (
                     <span data-testid="badge">{badgeContent}{children}</span>
                   ),
    Drawer:        ({ open, children, onClose }: any) =>
                     open ? (
                       <div data-testid="drawer">
                         <button data-testid="drawer-close" onClick={onClose} />
                         {children}
                       </div>
                     ) : null,
    List:          (p: any) => <ul data-testid="list" {...p}>{p.children}</ul>,
    ListItemButton:(p: any) => <li data-testid="list-item" {...p}>{p.children}</li>,
    ListItemIcon:  (p: any) => <span data-testid="list-item-icon">{p.children}</span>,
    ListItemText:  ({ primary }: any) => <span data-testid="list-item-text">{primary}</span>,
    useMediaQuery, // export du mock fn
  };
});

// ❸ MOCK DU HOOK THEME
vi.mock('@mui/material/styles', () => ({
  __esModule: true,
  useTheme: () => ({ breakpoints: { down: () => '' } }),
}));

// ❹ MOCK i18n
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ❺ MOCK DU STORE CART
vi.mock('../../stores/cartStore', () => ({
  __esModule: true,
  useCartStore: (sel: any) => sel({ items: [{ id: '1', quantity: 2 }] }),
}));

// ❻ MOCK DES ENFANTS
vi.mock('../LanguageSwitcher', () => ({
  __esModule: true,
  LanguageSwitcher: () => <div data-testid="lang-switch" />,
}));
vi.mock('../ThemeToggle', () => ({
  __esModule: true,
  ThemeToggle: ({ mode, toggleMode, 'aria-label': aria }: any) => (
    <button data-testid="theme-toggle" data-mode={mode} aria-label={aria} onClick={toggleMode} />
  ),
}));
vi.mock('./NavLinkList', () => ({
  __esModule: true,
  NavLinkList: ({ isMobile }: any) => (
    <nav data-testid={`navlist-${isMobile}`} />
  ),
}));
vi.mock('../Cart/CartPreview', () => ({
  __esModule: true,
  CartPreview: () => <div data-testid="cart-preview" />,
}));
vi.mock('../ActiveButton', () => ({
  __esModule: true,
  ActiveButton: ({ to, 'aria-label': aria }: any) => (
    <button data-testid="active-button" data-to={to} aria-label={aria} />
  ),
}));
vi.mock('../ActiveLink', () => ({
  __esModule: true,
  ActiveLink: ({ to, 'aria-label': aria }: any) => (
    <a data-testid="active-link" data-to={to} aria-label={aria} />
  ),
}));

// ❼ IMPORT DU COMPOSANT ET DU useMediaQuery MOCKABLE
import { Navbar } from './Navbar';
import { useMediaQuery } from '@mui/material';
const useMediaQueryMock = vi.mocked(useMediaQuery);

describe('<Navbar />', () => {
  const toggleModeMock = vi.fn();

  beforeEach(() => {
    cleanup();
    toggleModeMock.mockClear();
  });

  it('affiche la barre mobile et ouvre/ferme le drawer', () => {
    useMediaQueryMock.mockReturnValue(true);

    render(<Navbar mode="light" toggleMode={toggleModeMock} />);

    // Icon du menu
    const menuBtn = screen.getByTestId('icon-button');
    expect(menuBtn).toHaveAttribute('aria-label', 'navbar.menu');
    expect(screen.getByTestId('icon-menu')).toBeInTheDocument();

    // CartPreview stub
    expect(screen.getByTestId('cart-preview')).toBeInTheDocument();

    // Drawer fermé
    expect(screen.queryByTestId('drawer')).toBeNull();

    // Ouvre le drawer
    fireEvent.click(menuBtn);
    expect(screen.getByTestId('drawer')).toBeInTheDocument();

    // Contenu mobile
    expect(screen.getByTestId('navlist-true')).toBeInTheDocument();

    // Ferme le drawer
    fireEvent.click(screen.getByTestId('drawer-close'));
    expect(screen.queryByTestId('drawer')).toBeNull();
  });

  it('affiche la barre desktop avec tous les utilitaires', () => {
    useMediaQueryMock.mockReturnValue(false);

    render(<Navbar mode="dark" toggleMode={toggleModeMock} />);

    // NavLinkList desktop
    expect(screen.getByTestId('navlist-false')).toBeInTheDocument();

    // ThemeToggle
    const themeBtn = screen.getByTestId('theme-toggle');
    expect(themeBtn).toHaveAttribute('data-mode', 'dark');
    fireEvent.click(themeBtn);
    expect(toggleModeMock).toHaveBeenCalled();

    // LanguageSwitcher stub
    expect(screen.getByTestId('lang-switch')).toBeInTheDocument();

    // ActiveButton pour login
    const loginBtn = screen.getByTestId('active-button');
    expect(loginBtn).toHaveAttribute('data-to', '/login');
    expect(loginBtn).toHaveAttribute('aria-label', 'navbar.login');

    // Un seul CartPreview
    expect(screen.getAllByTestId('cart-preview')).toHaveLength(1);
  });
});

