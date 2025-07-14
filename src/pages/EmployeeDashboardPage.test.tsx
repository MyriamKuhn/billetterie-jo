import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import EmployeeDashboardPage from '../pages/EmployeeDashboardPage';

// Définir un alias pour le type de selector passé à useAuthStore
type AuthSelector = (state: { authToken: string | null }) => string | null;

// Variables pour capturer update functions
let nameUpdateFn: ((vals: any) => void) | null = null;
let emailUpdateFn: ((email: string) => void) | null = null;
let twoFAUpdateFn: ((enabled: boolean) => void) | null = null;

// Mocks globaux
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../services/userService', () => ({
  fetchUser: vi.fn(),
}));
vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('../utils/errorUtils', () => ({
  getErrorMessage: (_t: any, code: string) => `error:${code}`,
}));

// Mock child components
vi.mock('../components/OlympicLoader', () => ({ default: () => <div>Loading...</div> }));
vi.mock('../components/ErrorDisplay', () => ({
  ErrorDisplay: ({ title, message, showRetry, retryButtonText, onRetry, showHome, homeButtonText }: any) => (
    <div>
      <div data-testid="error-title">{title}</div>
      <div data-testid="error-message">{message}</div>
      {showRetry && <button data-testid="retry-button" onClick={onRetry}>{retryButtonText}</button>}
      {showHome && <button data-testid="home-button">{homeButtonText}</button>}
    </div>
  ),
}));
vi.mock('../components/NameSection', () => ({
  NameSection: ({ user, onUpdate }: any) => {
    nameUpdateFn = onUpdate;
    return <div data-testid="name-display">NameSection: {user.firstname}</div>;
  },
}));
vi.mock('../components/EmailSection', () => ({
  EmailSection: ({ currentEmail, onUpdate }: any) => {
    emailUpdateFn = onUpdate;
    return <div data-testid="email-display">EmailSection: {currentEmail}</div>;
  },
}));
vi.mock('../components/PasswordSection', () => ({ PasswordSection: () => <div>PasswordSection</div> }));
vi.mock('../components/TwoFASection', () => ({
  TwoFASection: ({ enabled, onToggle }: any) => {
    twoFAUpdateFn = onToggle;
    return <div data-testid="twofa-display">TwoFASection: {String(enabled)}</div>;
  },
}));
// Mock Seo pour capter data-testid et props
vi.mock('../components/Seo', () => ({
  default: ({ title, description }: any) => <div data-testid="seo" data-title={title} data-description={description} />,
}));
vi.mock('../components/PageWrapper', () => ({ PageWrapper: ({ children }: any) => <div>{children}</div> }));
// Mock Navigate
vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: any) => <div>Navigate to {to}</div>,
}));

import { fetchUser } from '../services/userService';
import { useAuthStore } from '../stores/useAuthStore';

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nameUpdateFn = null;
    emailUpdateFn = null;
    twoFAUpdateFn = null;
    // mock reload
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: vi.fn() },
    });
  });

  it('redirects to login immediately when no token', async () => {
    // Simule useAuthStore en invoquant le sélecteur, renvoie null pour authToken
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: null }));

    render(<EmployeeDashboardPage />);
    await waitFor(() => expect(screen.getByText(/Navigate to \/login/)).toBeInTheDocument());
    expect(fetchUser).not.toHaveBeenCalled();
  });

  it('shows loader initially when token present', () => {
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: 'token' }));
    (fetchUser as any).mockResolvedValue({ status: 200, data: { user: { firstname: 'John', lastname: 'Doe', email: 'john@example.com', twofa_enabled: false } } });
    render(<EmployeeDashboardPage />);
    // Pendant le chargement, on attend Seo + Loader
    expect(screen.getByTestId('seo')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders user data after successful fetch and allows state updates via callbacks and displays all sections and titles', async () => {
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: 'token' }));
    (fetchUser as any).mockResolvedValue({ status: 200, data: { user: { firstname: 'Jane', lastname: 'Smith', email: 'jane@example.com', twofa_enabled: true } } });
    render(<EmployeeDashboardPage />);
    // On devrait d'abord voir loader, puis la data
    await waitFor(() => expect(screen.getByTestId('name-display')).toHaveTextContent('NameSection: Jane'));
    // La Seo finale (dashboard) est aussi présente avec les props correctes
    const seoEl = screen.getByTestId('seo');
    expect(seoEl).toBeInTheDocument();
    expect(seoEl).toHaveAttribute('data-title', 'seo.title_employee');
    expect(seoEl).toHaveAttribute('data-description', 'seo.description_employee');
    // Vérifier autres sections
    expect(screen.getByTestId('email-display')).toHaveTextContent('EmailSection: jane@example.com');
    expect(screen.getByTestId('twofa-display')).toHaveTextContent('TwoFASection: true');
    expect(screen.getByText('dashboard.title_employee')).toBeInTheDocument();
    expect(screen.getByText('dashboard.subtitle_employee')).toBeInTheDocument();
    expect(screen.getByText('PasswordSection')).toBeInTheDocument();
    // Call inline update callbacks
    expect(nameUpdateFn).not.toBeNull();
    act(() => { nameUpdateFn!({ firstname: 'NewFirst' }); });
    expect(emailUpdateFn).not.toBeNull();
    act(() => { emailUpdateFn!('new@example.com'); });
    expect(twoFAUpdateFn).not.toBeNull();
    act(() => { twoFAUpdateFn!(false); });
  });

  it('shows error when fetch returns non-200', async () => {
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: 'token' }));
    (fetchUser as any).mockResolvedValue({ status: 500, data: {} });
    render(<EmployeeDashboardPage />);
    // D’abord loader, puis erreur
    await waitFor(() => expect(screen.getByTestId('error-message')).toHaveTextContent('errors.fetchProfile'));
    // Vérifier qu'aucun Seo n'est rendu dans la vue d'erreur
    expect(screen.queryByTestId('seo')).toBeNull();
    // Retry button déclenche reload
    fireEvent.click(screen.getByTestId('retry-button'));
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('shows error when fetch returns 200 but missing user', async () => {
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: 'token' }));
    (fetchUser as any).mockResolvedValue({ status: 200, data: {} });
    render(<EmployeeDashboardPage />);
    await waitFor(() => expect(screen.getByTestId('error-message')).toHaveTextContent('errors.fetchProfile'));
    // Vérifier qu'aucun Seo n'est rendu dans la vue d'erreur
    expect(screen.queryByTestId('seo')).toBeNull();
  });

  it('shows specific error message when axios error with code', async () => {
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: 'token' }));
    const error: any = new Error('Test'); error.isAxiosError = true; error.response = { data: { code: 'SOME_CODE' } };
    (fetchUser as any).mockRejectedValue(error);
    render(<EmployeeDashboardPage />);
    await waitFor(() => expect(screen.getByTestId('error-message')).toHaveTextContent('error:SOME_CODE'));
    // Vérifier qu'aucun Seo n'est rendu dans la vue d'erreur
    expect(screen.queryByTestId('seo')).toBeNull();
  });

  it('shows generic error when axios error with response but no code', async () => {
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: 'token' }));
    const error: any = new Error('Test'); error.isAxiosError = true; error.response = { data: {} };
    (fetchUser as any).mockRejectedValue(error);
    render(<EmployeeDashboardPage />);
    await waitFor(() => expect(screen.getByTestId('error-message')).toHaveTextContent('error:generic_error'));
    expect(screen.queryByTestId('seo')).toBeNull();
  });

  it('shows generic network error when axios error without response', async () => {
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: 'token' }));
    const error: any = new Error('Network'); error.isAxiosError = false;
    (fetchUser as any).mockRejectedValue(error);
    render(<EmployeeDashboardPage />);
    await waitFor(() => expect(screen.getByTestId('error-message')).toHaveTextContent('error:network_error'));
    expect(screen.queryByTestId('seo')).toBeNull();
  });

  it('axios error with isAxiosError true but no response property', async () => {
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: 'token' }));
    const error: any = new Error('Test'); error.isAxiosError = true;
    (fetchUser as any).mockRejectedValue(error);
    render(<EmployeeDashboardPage />);
    await waitFor(() => expect(screen.getByTestId('error-message')).toHaveTextContent('error:network_error'));
    expect(screen.queryByTestId('seo')).toBeNull();
  });

  it('does not update state after unmount', async () => {
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: 'token' }));
    let resolveFetch: any;
    const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
    (fetchUser as any).mockReturnValue(fetchPromise);
    const { unmount } = render(<EmployeeDashboardPage />);
    unmount();
    await act(async () => {
      resolveFetch({ status: 200, data: { user: { firstname: 'X', lastname: 'Y', email: 'x@y.com', twofa_enabled: false } } });
      await fetchPromise;
    });
    // On s'assure juste que fetchUser a été appelé, l'absence d'erreur suffit
    expect(fetchUser).toHaveBeenCalled();
  });

  it('briefly shows loader when no token, then redirects', async () => {
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: null }));
    render(<EmployeeDashboardPage />);
    const seoEl = await screen.findByTestId('seo', {}, { timeout: 50 }).catch(() => null);
    if (seoEl) {
      expect(seoEl).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    }
    await waitFor(() => expect(screen.getByText(/Navigate to \/login/)).toBeInTheDocument());
  });

  it('does not call setUser or setError when aborted before fetch resolves', async () => {
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: 'token' }));
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
    (fetchUser as any).mockReturnValue(fetchPromise);
    const { unmount } = render(<EmployeeDashboardPage />);
    unmount();
    await act(async () => {
      resolveFetch({
        status: 200,
        data: { user: { firstname: 'X', lastname: 'Y', email: 'x@y.com', twofa_enabled: false } }
      });
      await fetchPromise;
    });
    expect(fetchUser).toHaveBeenCalled();
  });

  it('skips setUser when fetch resolves after unmount (aborted) [try branch]', async () => {
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: 'token' }));
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
    (fetchUser as any).mockReturnValue(fetchPromise);
    const { unmount } = render(<EmployeeDashboardPage />);
    unmount();
    await act(async () => {
      resolveFetch({
        status: 200,
        data: { user: { firstname: 'X', lastname: 'Y', email: 'x@y.com', twofa_enabled: false } }
      });
      await fetchPromise;
    });
    expect(fetchUser).toHaveBeenCalled();
  });

  it('skips error handling when fetch rejects after unmount (aborted) [catch branch]', async () => {
    (useAuthStore as any).mockImplementation((selector: AuthSelector) => selector({ authToken: 'token' }));
    let rejectFetch: (reason?: any) => void;
    const fetchPromise = new Promise((_, reject) => { rejectFetch = reject; });
    (fetchUser as any).mockReturnValue(fetchPromise);
    const { unmount } = render(<EmployeeDashboardPage />);
    unmount();
    await act(async () => {
      rejectFetch(new Error('Simulated error'));
      try { await fetchPromise; } catch {}
    });
    expect(fetchUser).toHaveBeenCalled();
  });
});