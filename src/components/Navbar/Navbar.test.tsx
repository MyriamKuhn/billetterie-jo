import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';

// Mock react-router-dom to provide MemoryRouter and stub useNavigate
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => vi.fn(),
  };
});
import { MemoryRouter } from 'react-router-dom';

// ─── MOCK de Badge pour exposer badgeContent dans le DOM ───────────────────────
vi.mock('@mui/material/Badge', () => ({
  __esModule: true,
  default: ({ badgeContent, children }: any) => (
    <div data-testid="mock-badge">
      {children}
      <span data-testid="badge-content">{badgeContent}</span>
    </div>
  ),
}));

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

// ─── ❹ MOCK useTheme ─────────────────────────────────────────────────────────
vi.mock('@mui/material/styles', () => ({
  __esModule: true,
  useTheme: () => ({ breakpoints: { down: () => '' } }),
}));

// ─── ❺ MOCK react-i18next ────────────────────────────────────────────────────
vi.mock(
  'react-i18next',
  async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-i18next')>();
    return {
      __esModule: true,
      ...actual,
      initReactI18next: { type: '3rdParty', init: () => {} },
      useTranslation: () => ({ t: (k: string) => k }),
    };
  }
);

// ─── ❻ MOCK cartStore ────────────────────────────────────────────────────────
vi.mock('../../stores/useCartStore', () => ({
  __esModule: true,
  useCartStore: (selector: any) => selector({ items: [{ id: '1', quantity: 2 }] }),
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
vi.mock('../LanguageSwitcher', () => ({ __esModule: true, default: () => <div data-testid="lang-switch" /> }));
vi.mock('../ThemeToggle', () => ({
  __esModule: true,
  default: ({ mode, toggleMode, 'aria-label': aria }: any) => (
    <button data-testid="theme-toggle" data-mode={mode} aria-label={aria} onClick={toggleMode} />
  ),
}));
vi.mock('./NavLinkList', () => ({ __esModule: true, NavLinkList: ({ isMobile }: any) => <nav data-testid={`navlist-${isMobile}`} /> }));
vi.mock('../AuthMenu/AuthMenu', () => ({ __esModule: true, default: () => <div data-testid="auth-menu" /> }));
// Lazy-loaded CartPreview should include count
vi.mock('../CartPreview/CartPreview', () => ({ __esModule: true, default: () => <div data-testid="cart-preview">2</div> }));

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
    render(
      <MemoryRouter>
        <Navbar mode="light" toggleMode={toggleModeMock} />
      </MemoryRouter>
    );

    // 1) Bouton menu et icône
    const menuBtn = screen.getByTestId('icon-button');
    expect(menuBtn).toHaveAttribute('aria-label', 'navbar.menu');
    expect(screen.getByTestId('MenuIcon')).toBeInTheDocument();

    // 2) On attend le CartPreview lazy
    expect(await screen.findByTestId('cart-preview')).toHaveTextContent('2');

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
    render(
      <MemoryRouter>
        <Navbar mode="dark" toggleMode={toggleModeMock} />
      </MemoryRouter>
    );

    // NavLinkList desktop
    expect(screen.getByTestId('navlist-false')).toBeInTheDocument();

    // ThemeToggle
    const themeBtn = screen.getByTestId('theme-toggle');
    expect(themeBtn).toHaveAttribute('data-mode', 'dark');
    fireEvent.click(themeBtn);
    expect(toggleModeMock).toHaveBeenCalled();

    // LanguageSwitcher
    expect(screen.getByTestId('lang-switch')).toBeInTheDocument();

    // AuthMenu
    expect(screen.getByTestId('auth-menu')).toBeInTheDocument();

    // Un seul CartPreview
    const carts = await screen.findAllByTestId('cart-preview');
    expect(carts).toHaveLength(1);
  });

  it('affiche bien le nombre d’articles (cartCount) dans le drawer en mode mobile via CartPreview', async () => {
    useMediaQueryMock.mockReturnValue(true);
    render(
      <MemoryRouter>
        <Navbar mode="light" toggleMode={toggleModeMock} />
      </MemoryRouter>
    );

    // Ouvrir le drawer
    fireEvent.click(screen.getByTestId('icon-button'));
    expect(screen.getByTestId('drawer')).toBeInTheDocument();

    // CartPreview mocké affiche '2'
    const cart = await screen.findByTestId('cart-preview');
    expect(cart).toHaveTextContent('2');
  });
});

