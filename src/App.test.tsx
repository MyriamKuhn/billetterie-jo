import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── 1️⃣ Stub react-router-dom pour ne rendre QUE la route active ───────────────
vi.mock('react-router-dom', () => {
  const React = require('react');
  return {
    __esModule: true,
    BrowserRouter: ({ children }: any) => <div data-testid="router">{children}</div>,
    Routes: ({ children }: any) => <div data-testid="routes">{children}</div>,
    Route: ({ path, element }: any) =>
      window.location.pathname === path ? <React.Fragment>{element}</React.Fragment> : null,
  };
});

// ── 2️⃣ Stub MUI / Composants enfants ───────────────────────────────────────────
vi.mock('@mui/material/Toolbar', () => ({
  __esModule: true,
  default: (props: any) => <div id={props.id} data-testid="toolbar" />,
}));
vi.mock('./components/Navbar', () => ({ __esModule: true, default: () => <nav data-testid="navbar" /> }));
vi.mock('./components/Footer', () => ({ __esModule: true, default: () => <footer data-testid="footer" /> }));
vi.mock('./components/BackToTop', () => ({ __esModule: true, default: () => <div data-testid="back-to-top" /> }));
vi.mock('./components/ScrollToTop', () => ({ __esModule: true, default: () => <div data-testid="scroll-to-top-component" /> }));
vi.mock('./components/OlympicLoader', () => ({ __esModule: true, default: () => <div data-testid="loader" /> }));

// ── 3️⃣ Stub des pages lazy ────────────────────────────────────────────────────
vi.mock('./pages/HomePage', () => ({ __esModule: true, default: () => <div data-testid="page-home">Home</div> }));
vi.mock('./pages/TicketsPage', () => ({ __esModule: true, default: () => <div data-testid="page-tickets">Tickets</div> }));
vi.mock('./pages/LegalMentionsPage', () => ({ __esModule: true, default: () => <div data-testid="page-legal">Legal</div> }));
vi.mock('./pages/TermsPage',   () => ({ __esModule: true, default: () => <div data-testid="page-terms">Terms</div> }));
vi.mock('./pages/PolicyPage',  () => ({ __esModule: true, default: () => <div data-testid="page-policy">Policy</div> }));

// ── 4️⃣ Stub useLanguageStore pour qu’il prenne un sélecteur ───────────────────
vi.mock('./stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: (selector: (state: { lang: string }) => any) => selector({ lang: 'fr' }),
}));

// ── 5️⃣ Stub i18n avec spy sur changeLanguage ──────────────────────────────────
vi.mock('./i18n', () => {
  const changeLanguage = vi.fn();
  return {
    __esModule: true,
    default: { language: 'en-US', changeLanguage },
  };
});

// ── 6️⃣ Stub useTheme ──────────────────────────────────────────────────────────
const fakeThemeLight = { palette: { mode: 'light' as const } };
vi.mock('@mui/material/styles', () => ({
  __esModule: true,
  useTheme: vi.fn(() => fakeThemeLight),
}));

// ── 7️⃣ Import APRÈS TOUS les mocks ──────────────────────────────────────────────
import App from './App';
import i18n from './i18n';
import { lazy } from 'react';

const changeLanguage = (i18n as any).changeLanguage as ReturnType<typeof vi.fn>;

describe('<App />', () => {
  beforeEach(() => {
    cleanup();
    document.documentElement.lang = 'en';
    changeLanguage.mockReset();
  });

  it('rend la structure et configure lang + i18n.changeLanguage', () => {
    render(<App mode="light" toggleMode={vi.fn()} />);

    // Composants
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-to-top-component')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-top')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();

    // document.documentElement.lang est mis à 'fr'
    expect(document.documentElement.lang).toBe('fr');
    // i18n.changeLanguage a bien été appelé
    expect(changeLanguage).toHaveBeenCalledWith('fr');
  });

  it('affiche HomePage sur la route "/"', async () => {
    window.history.pushState({}, '', '/');
    render(<App mode="dark" toggleMode={vi.fn()} />);

    await waitFor(() => expect(screen.getByTestId('page-home')).toBeInTheDocument());
    expect(screen.queryByTestId('page-tickets')).toBeNull();
    expect(screen.queryByTestId('page-legal')).toBeNull();
  });

  it('affiche TicketsPage sur "/tickets"', async () => {
    window.history.pushState({}, '', '/tickets');
    render(<App mode="dark" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-tickets')).toBeInTheDocument());
  });

  it('affiche LegalMentionsPage sur "/legal-mentions"', async () => {
    window.history.pushState({}, '', '/legal-mentions');
    render(<App mode="dark" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-legal')).toBeInTheDocument());
  });

  it('ne re-change pas la langue si base === lang', async () => {
    // Prépare le cas où i18n.language commence par "fr"
    (i18n as any).language = 'fr-FR'
    changeLanguage.mockClear()

    render(<App mode="light" toggleMode={vi.fn()} />)

    // La balise <html> est toujours mise à "fr"
    expect(document.documentElement.lang).toBe('fr')
    // Mais comme base === lang, on ne rappelle pas changeLanguage
    expect(changeLanguage).not.toHaveBeenCalled()
  })

  it('affiche TermsPage sur "/terms"', async () => {
    window.history.pushState({}, '', '/terms');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-terms')).toBeInTheDocument());
  });

  it('affiche PolicyPage sur "/privacy-policy"', async () => {
    window.history.pushState({}, '', '/privacy-policy');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-policy')).toBeInTheDocument());
  });

  it('affiche HomePage sur "/cart", "/contact" et "/login"', async () => {
    for (const path of ['/cart', '/contact', '/login']) {
      window.history.pushState({}, '', path);
      render(<App mode="light" toggleMode={vi.fn()} />);
      await waitFor(() => expect(screen.getByTestId('page-home')).toBeInTheDocument());
      cleanup();
    }
  });

  it('montre le loader dans le fallback de Suspense', async () => {
    // 1️⃣ Réinitialise tous les modules
    vi.resetModules();

    // 2️⃣ Mock HomePage pour qu’elle n’aboutisse jamais
    vi.doMock('./pages/HomePage', () => ({
      __esModule: true,
      default: lazy(() => new Promise(() => {})),
    }));

    // 3️⃣ Import dynamiquement App **après** avoir mis en place le mock
    const { default: AppWithStall } = await import('./App');

    // 4️⃣ Render et assert sur le loader
    window.history.pushState({}, '', '/');
    render(<AppWithStall mode="light" toggleMode={vi.fn()} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });
});

