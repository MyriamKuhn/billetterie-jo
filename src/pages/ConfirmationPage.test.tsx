// src/pages/ConfirmationPage.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── 1) MOCKER react-router-dom AVANT d’importer ConfirmationPage ────────────────
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/confirm', search: '', state: {} } as any;

vi.mock('react-router-dom', () => {
  const actual = vi.importActual<any>('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      // pour confirmation.paid_at, on veut interpoler opts.date
      if (key === 'confirmation.paid_at') {
        return `paid at: ${opts.date}`;
      }
      return key;
    },
    // on ajoute i18n.language pour que Seo ne crash pas
    i18n: {
      language: 'en',
      changeLanguage: async () => {}, // facultatif
    },
  }),
}));

// ─── 2) IMPORTS APRÈS MOCK SHRINKING ─────────────────────────────────────────────
import ConfirmationPage from './ConfirmationPage';
import * as paymentService from '../services/paymentService';
import { logError, logWarn } from '../utils/logger';

// ─── 3) AUTRES MOCKS ───────────────────────────────────────────────────────────────
let mockToken: string | null = 'tok';
vi.mock('../stores/useAuthStore', () => ({
  __esModule: true,
  useAuthStore: (selector: any) => selector({ authToken: mockToken }),
}));

vi.mock('../stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: (selector: any) => selector({ lang: 'en' }),
}));

const mockUnlock = vi.fn();
vi.mock('../stores/useCartStore', () => ({
  __esModule: true,
  useCartStore: (selector: any) => selector({ unlockCart: mockUnlock }),
}));

vi.mock('../services/paymentService', () => ({
  __esModule: true,
  getPaymentStatus: vi.fn(),
}));

vi.mock('../utils/logger', () => ({
  __esModule: true,
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

// ─── 4) SUITE DE TESTS ─────────────────────────────────────────────────────────────
describe('ConfirmationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = 'tok';
    mockNavigate.mockReset();
    mockUnlock.mockReset();
  });

  it('unlockCart est appelé à l’arrivée', async () => {
    (paymentService.getPaymentStatus as any).mockResolvedValue({
      status: 200,
      data: { status: 'any', paid_at: '2025-01-01T12:00:00Z' },
    });
    render(<ConfirmationPage />);
    await waitFor(() => expect(mockUnlock).toHaveBeenCalled());
  });

  it('sans paymentUuid → affichage "no_uuid"', async () => {
    render(<ConfirmationPage />);
    await waitFor(() => {
      expect(screen.getByText('errors.error_confirmation')).toBeInTheDocument();
      expect(screen.getByText('errors.no_uuid')).toBeInTheDocument();
    });
  });

  it('avec UUID mais sans token → "not_authenticated" + redirection', async () => {
    mockToken = null;
    mockLocation.state = { paymentUuid: 'u' };
    render(<ConfirmationPage />);
    await waitFor(() => {
      expect(screen.getByText('errors.error_confirmation')).toBeInTheDocument();
      expect(screen.getByText('errors.not_authenticated')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith(
        `/login?next=${encodeURIComponent('/confirm')}`
      );
    });
  });

  it('UUID depuis query param', async () => {
    mockLocation.state = {};
    mockLocation.search = '?paymentUuid=qqq';
    (paymentService.getPaymentStatus as any).mockResolvedValue({
      status: 200,
      data: { status: 'ok', paid_at: '2025-02-02T15:30:00Z' },
    });
    render(<ConfirmationPage />);
    await waitFor(() => {
      expect(screen.getByText('confirmation.thank_you')).toBeInTheDocument();
      expect(screen.getByText(/^paid at:/)).toBeInTheDocument();
    });
  });

  it('status ≠200 → logWarn + erreur fetch_error', async () => {
    mockLocation.state = { paymentUuid: 'u' };
    (paymentService.getPaymentStatus as any).mockResolvedValue({
      status: 500,
      data: null,
    });
    render(<ConfirmationPage />);
    await waitFor(() => {
      expect(logWarn).toHaveBeenCalledWith(
        'Unexpected status getPaymentStatus:',
        null
      );
      expect(screen.getByText('errors.fetch_error')).toBeInTheDocument();
    });
  });

  it('exception dans getPaymentStatus → logError + fetch_error', async () => {
    mockLocation.state = { paymentUuid: 'u' };
    (paymentService.getPaymentStatus as any).mockRejectedValue(new Error('oops'));
    render(<ConfirmationPage />);
    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith(
        'Error fetching payment status:',
        expect.any(Error)
      );
      expect(screen.getByText('errors.fetch_error')).toBeInTheDocument();
    });
  });

  it('fetch OK → affiche boutons et navigation', async () => {
    mockLocation.state = { paymentUuid: 'u' };
    (paymentService.getPaymentStatus as any).mockResolvedValue({
      status: 200,
      data: { status: 'done', paid_at: '2025-03-03T08:00:00Z' },
    });
    render(<ConfirmationPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'confirmation.continue_shopping' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'confirmation.continue_shopping' }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
    fireEvent.click(screen.getByRole('button', { name: 'confirmation.view_orders' }));
    expect(mockNavigate).toHaveBeenCalledWith('/user/orders');
    fireEvent.click(screen.getByRole('button', { name: 'confirmation.view_tickets' }));
    expect(mockNavigate).toHaveBeenCalledWith('/user/tickets');
  });

  it('affiche "-" quand paid_at est absent', async () => {
    // 1) on simule un paymentUuid valide
    mockLocation.state = { paymentUuid: 'u' };

    // 2) on renvoie une réponse avec paid_at à null
    (paymentService.getPaymentStatus as any).mockResolvedValue({
      status: 200,
      data: { status: 'done', paid_at: null },
    });

    // 3) on rend la page
    render(<ConfirmationPage />);

    // 4) on attend que le loader ait disparu et que le texte interpolé apparaisse
    await waitFor(() => {
      // votre mock de t('confirmation.paid_at') renvoie `paid at: ${opts.date}`
      expect(screen.getByText('paid at: -')).toBeInTheDocument();
    });
  });
});
