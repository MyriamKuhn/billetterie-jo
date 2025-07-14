import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import EmployeeValidatePage from '../pages/EmployeeValidatePage';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';

// ─── MOCK DES HOOKS & LIBS ─────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, any>) => {
      if (vars && vars.dt) {
        return `${key}:${vars.dt}`;
      }
      return key;
    },
    i18n: { language: 'fr' },
  }),
}));

// On mocke Zustand en respectant la signature (selector: fn) => selector(state)
vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: any) => any) =>
    // on expose authToken
    selector({ authToken: 'FAKE_TOKEN' }),
}));

vi.mock('../stores/useLanguageStore', () => ({
  useLanguageStore: (selector: (s: any) => any) =>
    // on expose lang
    selector({ lang: 'fr' }),
}));

// Mock des utilitaires
vi.mock('../utils/format', () => ({
  formatDate: (d: string) => `formatted-${d}`,
}));
vi.mock('../utils/ticket', () => ({
  getTicketStatusChipColor: () => 'success',
}));

// Spy axios
const getSpy = vi.spyOn(axios, 'post');

// ─── TESTS ───────────────────────────────────────────────────────────────────
describe('<EmployeeValidatePage />', () => {
  beforeEach(() => {
    getSpy.mockReset();
  });

  it('affiche le formulaire manuel au démarrage', () => {
    render(<MemoryRouter><EmployeeValidatePage /></MemoryRouter>);
    expect(screen.getByText('validate.title')).toBeTruthy();
    expect(screen.getByLabelText('validate.manual_label')).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'validate.validate_button' });
    expect(btn).toBeDisabled();
  });

  it('active le bouton quand on saisit un code', () => {
    render(<MemoryRouter><EmployeeValidatePage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('validate.manual_label'), { target: { value: 'ABC' } });
    expect(screen.getByRole('button', { name: 'validate.validate_button' })).not.toBeDisabled();
  });

  it('montre l’état de chargement pendant la validation', () => {
    // on simule une promesse pendante
    getSpy.mockReturnValue(new Promise(() => {}));
    render(<MemoryRouter><EmployeeValidatePage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('validate.manual_label'), { target: { value: 'TOK' } });
    fireEvent.click(screen.getByRole('button', { name: 'validate.validate_button' }));
    const btn = screen.getByRole('button', { name: 'validate.validating' });
    expect(btn).toBeDisabled();
    // contient un spinner (MUI CircularProgress)
    expect(btn.querySelector('svg')).toBeTruthy();
  });

  it('affiche le succès lorsque l’API répond', async () => {
    getSpy.mockResolvedValue({ data: { used_at: '2025-07-01' } });
    render(<MemoryRouter><EmployeeValidatePage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('validate.manual_label'), { target: { value: 'TOK123' } });
    fireEvent.click(screen.getByRole('button', { name: 'validate.validate_button' }));
    await waitFor(() => {
      expect(screen.getByText('scan.validated_title')).toBeTruthy();
      expect(screen.getByText('scan.validated_message:formatted-2025-07-01')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'validate.reset_button' })).toBeTruthy();
  });

  it('gère le 409 (already_used) sans message d’erreur générique', async () => {
    const conflict = {
      status: 'already_used',
      user: { firstname: 'Jean', lastname: 'Dupont', email: 'j.dupont@example.com' },
      event: { name: 'Expo', date: '2025-08-15', time: '20:00', location: 'Salle A', places: 1 },
      ticket_token: 'T',
      token: 'T',
    };
    getSpy.mockRejectedValue({ response: { status: 409, data: conflict } });
    render(<MemoryRouter><EmployeeValidatePage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('validate.manual_label'), { target: { value: 'T' } });
    fireEvent.click(screen.getByRole('button', { name: 'validate.validate_button' }));

    await waitFor(() => {
      expect(screen.getByText('validate.results_title')).toBeTruthy();
      expect(screen.getByText('scan.status.already_used')).toBeTruthy();

      // match le nom même s'il est coupé par un <br> ou des retours à la ligne
      expect(screen.getByText(/Jean\s+Dupont/)).toBeTruthy();
      expect(screen.getByText(/j\.dupont@example\.com/)).toBeTruthy();
    });
  });

  it('montre l’erreur générique pour les autres codes d’erreur', async () => {
    getSpy.mockRejectedValue({ response: { status: 500 } });
    render(<MemoryRouter><EmployeeValidatePage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('validate.manual_label'), { target: { value: 'X' } });
    fireEvent.click(screen.getByRole('button', { name: 'validate.validate_button' }));
    await waitFor(() => {
      expect(screen.getByText('errors.genericErrorTitle')).toBeTruthy();
      expect(screen.getByText('errors.validate_error')).toBeTruthy();
    });
  });

  it('remet tout à zéro avec le bouton reset', async () => {
    getSpy.mockResolvedValue({ data: { used_at: '2025-07-07' } });
    render(<MemoryRouter><EmployeeValidatePage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('validate.manual_label'), { target: { value: 'TOK7' } });
    fireEvent.click(screen.getByRole('button', { name: 'validate.validate_button' }));
    await waitFor(() => screen.getByText('scan.validated_title'));
    fireEvent.click(screen.getByRole('button', { name: 'validate.reset_button' }));
    expect(screen.getByText('validate.title')).toBeTruthy();
    expect(screen.getByLabelText('validate.manual_label')).toHaveValue('');
  });

  it('appelle window.location.reload() lorsque l’on clique sur Retry', async () => {
    // 1) On stub window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock },
    });

    // 2) On force l’erreur 500
    (axios.post as jest.MockedFunction<typeof axios.post>).mockRejectedValue({
      response: { status: 500 },
    });

    render(
      <MemoryRouter>
        <EmployeeValidatePage />
      </MemoryRouter>
    );

    // 3) On déclenche la validation pour voir l’erreur
    fireEvent.change(screen.getByLabelText('validate.manual_label'), {
      target: { value: 'X' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'validate.validate_button' }));

    // 4) On attend l’apparition du retry
    const retryBtn = await screen.findByRole('button', { name: 'errors.retry' });
    expect(retryBtn).toBeTruthy();

    // 5) On clique dessus et on vérifie reload()
    fireEvent.click(retryBtn);
    expect(reloadMock).toHaveBeenCalled();
  });
});
