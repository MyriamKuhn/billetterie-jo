import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import EmployeeScanPage from './EmployeeScanPage';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// ─── MOCK DES HOOKS & LIBS ─────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, any>) => {
      if (vars) {
        return Object.entries(vars).reduce(
          (str, [k, v]) => str.replace(`{{${k}}}`, String(v)),
          key
        );
      }
      return key;
    },
    i18n: { language: 'fr' },
  }),
}));

vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: any) => any) =>
    selector({ authToken: 'FAKE_TOKEN' }),
}));

vi.mock('../stores/useLanguageStore', () => ({
  useLanguageStore: (selector: (s: any) => any) =>
    selector({ lang: 'fr' }),
}));

// Stub useQrScanner but capture callbacks and spy on start/stop
let decodeCallback: (decoded: string) => void;
let cameraErrorCallback: () => void;
const startSpy = vi.fn();
const stopSpy = vi.fn();
vi.mock('../hooks/useQrScanner', () => ({
  useQrScanner: (_regionId: string, onSuccess: (decoded: string) => void, onError: () => void) => {
    decodeCallback = onSuccess;
    cameraErrorCallback = onError;
    return { start: startSpy, stop: stopSpy };
  },
}));

// ─── SPY SUR AXIOS ────────────────────────────────────────────────────────────
const mockGet = vi.spyOn(axios, 'get');
const mockPost = vi.spyOn(axios, 'post');

// ─── FIXTURE ──────────────────────────────────────────────────────────────────
const fakeTicket = {
  token: 'ABC123',
  status: 'issued',
  user: { firstname: 'Jean', lastname: 'Dupont', email: 'jean@example.com' },
  event: { name: 'Concert', date: '2025-08-01', time: '20:00', location: 'Stade', places: 2 },
  used_at: undefined
};

// ─── RESET DES MOCKS AVANT CHAQUE TEST ────────────────────────────────────────
beforeEach(() => {
  startSpy.mockClear();
  stopSpy.mockClear();
  mockGet.mockReset();
  mockPost.mockReset();
});

describe('<EmployeeScanPage />', () => {
  it('affiche l’écran initial (scan + champ manuel)', () => {
    render(
      <MemoryRouter>
        <EmployeeScanPage />
      </MemoryRouter>
    );
    expect(screen.getByText('scan.title')).toBeInTheDocument();
    expect(screen.getByText('scan.scan_instructions')).toBeInTheDocument();
    expect(screen.getByLabelText('scan.manual_label')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'scan.manual_button' })).toBeEnabled();
  });

  it('n’appelle pas axios.get si le champ manuel est vide', () => {
    render(
      <MemoryRouter>
        <EmployeeScanPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'scan.manual_button' }));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('affiche le loader pendant le fetching', async () => {
    mockGet.mockReturnValue(new Promise(() => {/* pending */}));
    render(
      <MemoryRouter>
        <EmployeeScanPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText('scan.manual_label'), { target: { value: 'TOK' } });
    fireEvent.click(screen.getByRole('button', { name: 'scan.manual_button' }));
    expect(await screen.findByText('scan.fetching')).toBeInTheDocument();
  });

  it('affiche une erreur 404 sur GET et propose scan.not_found', async () => {
    mockGet.mockRejectedValue({ response: { status: 404 } });
    render(
      <MemoryRouter>
        <EmployeeScanPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText('scan.manual_label'), { target: { value: 'FOO' } });
    fireEvent.click(screen.getByRole('button', { name: 'scan.manual_button' }));
    expect(await screen.findByText('scan.not_found')).toBeInTheDocument();
  });

  it('affiche une erreur non-404 sur GET et propose retry', async () => {
    mockGet.mockRejectedValue({ response: { status: 500 } });
    render(
      <MemoryRouter>
        <EmployeeScanPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText('scan.manual_label'), { target: { value: 'ERR' } });
    fireEvent.click(screen.getByRole('button', { name: 'scan.manual_button' }));
    expect(await screen.findByText('scan.fetch_error')).toBeInTheDocument();

    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy }
    });
    fireEvent.click(screen.getByRole('button', { name: 'errors.retry' }));
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('affiche le message de camera error si le scanner échoue', async () => {
    render(
      <MemoryRouter>
        <EmployeeScanPage />
      </MemoryRouter>
    );
    cameraErrorCallback();
    expect(await screen.findByText('scan.camera_error')).toBeInTheDocument();
  });

  it('gère un scan success via callback', async () => {
    mockGet.mockResolvedValue({ data: fakeTicket });
    render(
      <MemoryRouter>
        <EmployeeScanPage />
      </MemoryRouter>
    );
    decodeCallback('AUTO123');
    expect(stopSpy).toHaveBeenCalled();
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/scan/AUTO123'),
      expect.any(Object)
    );
    expect(await screen.findByText('Concert')).toBeInTheDocument();
  });

  it('affiche les infos du ticket après GET réussi et permet de valider', async () => {
    mockGet.mockResolvedValue({ data: fakeTicket });
    mockPost.mockResolvedValue({ data: { used_at: '2025-07-15T10:00:00Z' } });

    render(
      <MemoryRouter>
        <EmployeeScanPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText('scan.manual_label'), { target: { value: 'ABC123' } });
    fireEvent.click(screen.getByRole('button', { name: 'scan.manual_button' }));

    expect(await screen.findByText('Concert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'scan.validate_button' }));
    expect(await screen.findByText('scan.validated_message')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'scan.reset_button' }));
    expect(startSpy).toHaveBeenCalled();
  });

  it('affiche une erreur non-409 sur POST validation', async () => {
    mockGet.mockResolvedValue({ data: fakeTicket });
    mockPost.mockRejectedValue({ response: { status: 500 } });

    render(
      <MemoryRouter>
        <EmployeeScanPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText('scan.manual_label'), { target: { value: 'ABC123' } });
    fireEvent.click(screen.getByRole('button', { name: 'scan.manual_button' }));
    await screen.findByText('scan.validate_button');
    fireEvent.click(screen.getByRole('button', { name: 'scan.validate_button' }));
    expect(await screen.findByText('errors.validate_error')).toBeInTheDocument();
  });

  it('affiche Reset si le ticket n’est pas "issued"', async () => {
    const usedTicket = { ...fakeTicket, status: 'used' };
    mockGet.mockResolvedValue({ data: usedTicket });

    render(
      <MemoryRouter>
        <EmployeeScanPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText('scan.manual_label'), { target: { value: 'USED123' } });
    fireEvent.click(screen.getByRole('button', { name: 'scan.manual_button' }));
    expect(await screen.findByRole('button', { name: 'scan.reset_button' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'scan.validate_button' })).toBeNull();
  });

  it('arrête le scanner au démontage', () => {
    const { unmount } = render(
      <MemoryRouter>
        <EmployeeScanPage />
      </MemoryRouter>
    );
    unmount();
    expect(stopSpy).toHaveBeenCalled();
  });

  it("montre le spinner, appelle l'API de validation et passe en 'validé'", async () => {
    mockGet.mockResolvedValue({ data: fakeTicket });
    mockPost.mockResolvedValue({ data: { used_at: "2025-07-15T10:00:00Z" } });

    render(
      <MemoryRouter>
        <EmployeeScanPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('scan.manual_label'), {
      target: { value: fakeTicket.token }
    });
    fireEvent.click(screen.getByRole('button', { name: 'scan.manual_button' }));
    expect(await screen.findByText(fakeTicket.event.name)).toBeInTheDocument();

    const btnValider = screen.getByRole('button', { name: 'scan.validate_button' });
    fireEvent.click(btnValider);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(mockPost).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/tickets/scan/${fakeTicket.token}`,
      {},
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Bearer\s+/),
          'Accept-Language': expect.anything(),
        }),
      })
    );

    expect(await screen.findByText('scan.validated_message')).toBeInTheDocument();
  });

  it("lorsque le POST renvoie 409, on reste en mode vérification (branche 409)", async () => {
    mockGet.mockResolvedValue({ data: fakeTicket });
    mockPost.mockRejectedValue({ response: { status: 409 } });

    render(<MemoryRouter><EmployeeScanPage /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText('scan.manual_label'), { target: { value: 'ABC123' } });
    fireEvent.click(screen.getByRole('button', { name: 'scan.manual_button' }));
    await screen.findByText('Concert');
    fireEvent.click(screen.getByRole('button', { name: 'scan.validate_button' }));

    // désormais on tombe sur l'écran d'erreur
    expect(await screen.findByText('errors.validate_error')).toBeInTheDocument();
  });

  it('couvre la branche arrêt du scanner sur unmount', async () => {
    mockGet.mockResolvedValue({ data: { ...fakeTicket, token: 'TK', event: { ...fakeTicket.event, name: 'E' } } });

    const { unmount } = render(
      <MemoryRouter>
        <EmployeeScanPage />
      </MemoryRouter>
    );

    // Trigger a fetch so que le scanner soit déjà arrêté une fois
    fireEvent.change(screen.getByLabelText('scan.manual_label'), { target: { value: 'TK' } });
    fireEvent.click(screen.getByRole('button', { name: 'scan.manual_button' }));
    await screen.findByText('E');

    // Puis on démonte pour couvrir le cleanup
    unmount();
    expect(stopSpy).toHaveBeenCalled();
  });
});

