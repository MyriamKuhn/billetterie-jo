import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── 1️⃣ Stub react-router-dom pour ne rendre QUE la route active ───────────────
vi.mock('react-router-dom', () => {
  const React = require('react');
  return {
    __esModule: true,
    BrowserRouter: ({ children }: any) => <div data-testid="router">{children}</div>,
    Routes: ({ children }: any) => <div data-testid="routes">{children}</div>,
    Route: ({ path, element }: any) => {
      // on convertit "/foo/:bar/baz" en regex ^/foo/[^/]+/baz$
      const regex = new RegExp(
        '^' +
          path
            .replace(/:[^/]+/g, '[^/]+')
            .replace(/\//g, '\\/') +
          '$'
      );
      return regex.test(window.location.pathname)
        ? <React.Fragment>{element}</React.Fragment>
        : null;
    },
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
vi.mock('./pages/ProductsPage', () => ({ __esModule: true, default: () => <div data-testid="page-products">Tickets</div> }));
vi.mock('./pages/LegalMentionsPage', () => ({ __esModule: true, default: () => <div data-testid="page-legal">Legal</div> }));
vi.mock('./pages/TermsPage',   () => ({ __esModule: true, default: () => <div data-testid="page-terms">Terms</div> }));
vi.mock('./pages/PolicyPage',  () => ({ __esModule: true, default: () => <div data-testid="page-policy">Policy</div> }));
vi.mock('./pages/ContactPage', () => ({ __esModule: true, default: () => <div data-testid="page-contact">Contact</div> }));
vi.mock('./pages/CartPage',       () => ({ __esModule: true, default: () => <div data-testid="page-cart">Cart</div> }));
vi.mock('./pages/LoginPage', () => ({__esModule: true, default: () => <div data-testid="page-login">Login</div> }));
vi.mock('./pages/SignupPage', () => ({ __esModule: true, default: () => <div data-testid="page-signup">Signup</div> }));
vi.mock('./pages/VerificationResultPage', () => ({__esModule: true, default: () => <div data-testid="page-verification-result">Verification Result</div>}));
vi.mock('./pages/ForgotPasswordPage', () => ({ __esModule: true, default: () => <div data-testid="page-forgot-password">Forgot Password</div> }));
vi.mock('./pages/PasswordResetPage', () => ({ __esModule: true, default: () => <div data-testid="page-password-reset">Password Reset</div> }));
vi.mock('./pages/UserDashboardPage', () => ({ __esModule: true, default: () => <div data-testid="page-user-dashboard">User Dashboard</div> }));
vi.mock('./pages/UnauthorizedPage', () => ({ __esModule: true, default: () => <div data-testid="page-unauthorized">Unauthorized</div> }));
vi.mock('./pages/CheckoutPage', () => ({ __esModule: true, default: () => <div data-testid="page-checkout">Checkout</div> }));
vi.mock('./pages/ConfirmationPage', () => ({ __esModule: true, default: () => <div data-testid="page-confirmation">Confirmation</div> }));
vi.mock('./pages/UserTicketsPage', () => ({ __esModule: true, default: () => <div data-testid="page-user-tickets">User Tickets</div> }));
vi.mock('./pages/InvoicesPage', () => ({ __esModule: true, default: () => <div data-testid="page-invoices">Invoices</div> }));
vi.mock('./pages/AdminDashboardPage', () => ({ __esModule: true, default: () => <div data-testid="page-admin-dashboard">Admin Dashboard</div> }));
vi.mock('./pages/AdminProductsPage', () => ({ __esModule: true, default: () => <div data-testid="page-admin-products">Admin Products</div> }));
vi.mock('./pages/AdminUsersPage', () => ({ __esModule: true, default: () => <div data-testid="page-admin-users">Admin Users</div> }));
vi.mock('./pages/AdminEmployeesPage', () => ({ __esModule: true, default: () => <div data-testid="page-admin-employees">Admin Employees</div> }));
vi.mock('./pages/AdminOrdersPage', () => ({ __esModule: true, default: () => <div data-testid="page-admin-orders">Admin Orders</div> }));

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

// Stub RequireAuth pour qu’il rende toujours children sans contrôle
vi.mock('./components/RequireAuth', () => ({
  __esModule: true,
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
    expect(screen.queryByTestId('page-products')).toBeNull();
    expect(screen.queryByTestId('page-legal')).toBeNull();
  });

  it('affiche ProductsPage sur "/tickets"', async () => {
    window.history.pushState({}, '', '/tickets');
    render(<App mode="dark" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-products')).toBeInTheDocument());
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

  it('affiche ContactPage sur "/contact"', async () => {
    window.history.pushState({}, '', '/contact');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-contact')).toBeInTheDocument());
  });

  it('affiche CartPage sur "/cart"', async () => {
    window.history.pushState({}, '', '/cart');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-cart')).toBeInTheDocument());
  });

  it('affiche LoginPage sur "/login"', async () => {
    window.history.pushState({}, '', '/login');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-login')).toBeInTheDocument());
  });

  it('affiche SignupPage sur "/signup"', async () => {
    window.history.pushState({}, '', '/signup');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-signup')).toBeInTheDocument());
  });

  it('affiche VerificationResultPage sur "/verification-result/:status"', async () => {
    window.history.pushState({}, '', '/verification-result/success');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByTestId('page-verification-result')).toBeInTheDocument()
    );
  });

  it('affiche ForgotPasswordPage sur "/forgot-password"', async () => {
    window.history.pushState({}, '', '/forgot-password');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-forgot-password')).toBeInTheDocument());
  });

  it('affiche PasswordResetPage sur "/password-reset"', async () => {
    window.history.pushState({}, '', '/password-reset');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-password-reset')).toBeInTheDocument());
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

describe('Routes supplémentaires dans <App />', () => {
  it('affiche UnauthorizedPage sur la route "/unauthorized"', async () => {
    window.history.pushState({}, '', '/unauthorized');
    render(<App mode="light" toggleMode={vi.fn()} />);
    // Attendre le rendu lazy + Suspense
    await waitFor(() => expect(screen.getByTestId('page-unauthorized')).toBeInTheDocument());
    // Vérifier qu’aucune autre page n’est présente
    expect(screen.queryByTestId('page-home')).toBeNull();
  });

  it('affiche UserDashboardPage sur "/user/dashboard" quand RequireAuth autorise l’accès (stubbed)', async () => {
    window.history.pushState({}, '', '/user/dashboard');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-user-dashboard')).toBeInTheDocument());
    // Vérifier qu’aucune autre page (home, login, etc.) n’est présente
    expect(screen.queryByTestId('page-home')).toBeNull();
  });

  it('affiche CheckoutPage sur "/checkout" quand RequireAuth autorise l’accès (stubbed)', async () => {
    window.history.pushState({}, '', '/checkout');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-checkout')).toBeInTheDocument());
    // Vérifier qu’aucune autre page (home, login, etc.) n’est présente
    expect(screen.queryByTestId('page-home')).toBeNull();
  });

  it('affiche ConfirmationPage sur "/confirmation" quand RequireAuth autorise l’accès (stubbed)', async () => {
    window.history.pushState({}, '', '/confirmation');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-confirmation')).toBeInTheDocument());
    // Vérifier qu’aucune autre page (home, login, etc.) n’est présente
    expect(screen.queryByTestId('page-home')).toBeNull();
  });

  it('affiche UserTicketsPage sur "/user/tickets" quand RequireAuth autorise l’accès (stubbed)', async () => {
    window.history.pushState({}, '', '/user/tickets');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-user-tickets')).toBeInTheDocument());
    // Vérifier qu’aucune autre page (home, login, etc.) n’est présente
    expect(screen.queryByTestId('page-home')).toBeNull();
  });

  it('affiche InvoicesPage sur "/invoices" quand RequireAuth autorise l’accès (stubbed)', async () => {
    window.history.pushState({}, '', '/user/orders');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-invoices')).toBeInTheDocument());
    // Vérifier qu’aucune autre page (home, login, etc.) n’est présente
    expect(screen.queryByTestId('page-home')).toBeNull();
  });

  it('affiche AdminDashboardPage sur "/admin/dashboard" quand RequireAuth autorise l’accès (stubbed)', async () => {
    window.history.pushState({}, '', '/admin/dashboard');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-admin-dashboard')).toBeInTheDocument());
    // Vérifier qu’aucune autre page (home, login, etc.) n’est présente
    expect(screen.queryByTestId('page-home')).toBeNull();
  });

  it('affiche AdminProductsPage sur "/admin/products" quand RequireAuth autorise l’accès (stubbed)', async () => {
    window.history.pushState({}, '', '/admin/tickets');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-admin-products')).toBeInTheDocument());
    // Vérifier qu’aucune autre page (home, login, etc.) n’est présente
    expect(screen.queryByTestId('page-home')).toBeNull();
  });

  it('affiche AdminUsersPage sur "/admin/users" quand RequireAuth autorise l’accès (stubbed)', async () => {
    window.history.pushState({}, '', '/admin/users');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-admin-users')).toBeInTheDocument());
    // Vérifier qu’aucune autre page (home, login, etc.) n’est présente
    expect(screen.queryByTestId('page-home')).toBeNull();
  });

  it('affiche AdminEmployeesPage sur "/admin/employees" quand RequireAuth autorise l’accès (stubbed)', async () => {
    window.history.pushState({}, '', '/admin/employees');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-admin-employees')).toBeInTheDocument());
    // Vérifier qu’aucune autre page (home, login, etc.) n’est présente
    expect(screen.queryByTestId('page-home')).toBeNull();
  });

  it('affiche OrdersPage sur "/admin/orders" quand RequireAuth autorise l’accès (stubbed)', async () => {
    window.history.pushState({}, '', '/admin/orders');
    render(<App mode="light" toggleMode={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('page-admin-orders')).toBeInTheDocument());
    // Vérifier qu’aucune autre page (home, login, etc.) n’est présente
    expect(screen.queryByTestId('page-home')).toBeNull();
  });
});


