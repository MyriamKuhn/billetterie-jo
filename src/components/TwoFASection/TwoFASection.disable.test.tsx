// src/components/TwoFASection/TwoFASection.disable.test.tsx

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TwoFASection } from './TwoFASection'; // ajustez le chemin si besoin
import { useAuthStore } from '../../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { enableTwoFA, confirmTwoFA, disableTwoFA } from '../../services/userService';

// ------ Mocks globaux ------

// Mock du service userService : on exporte bien enableTwoFA, confirmTwoFA, disableTwoFA
vi.mock('../../services/userService', () => ({
  enableTwoFA: vi.fn(),
  confirmTwoFA: vi.fn(),
  disableTwoFA: vi.fn(),
}));

// Mock MUI Button simplifié
vi.mock('@mui/material/Button', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => {
    // retire disabled pour cliquer toujours
    const { disabled, ...rest } = props;
    return <button {...rest}>{children}</button>;
  },
}));

// Mock useTranslation si nécessaire
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock useAuthStore
vi.mock('../../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock useNavigate
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

// Mock useMediaQuery
vi.mock('@mui/material/useMediaQuery');

// Mock getErrorMessage si utilisé dans le composant
vi.mock('../../utils/errorUtils', () => ({
  getErrorMessage: (_t: any, code: string) => `error:${code}`,
}));

describe('TwoFASection - branche disable (fichier dédié)', () => {
  // Récupérer les mocks importés
  const mockEnableTwoFA = enableTwoFA as unknown as ReturnType<typeof vi.fn>;
  const mockConfirmTwoFA = confirmTwoFA as unknown as ReturnType<typeof vi.fn>;
  const mockDisableTwoFA = disableTwoFA as unknown as ReturnType<typeof vi.fn>;
  const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;
  const mockUseNavigate = useNavigate as unknown as ReturnType<typeof vi.fn>;
  const mockUseMediaQuery = useMediaQuery as unknown as ReturnType<typeof vi.fn>;

  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();

    // Par défaut desktop
    mockUseMediaQuery.mockReturnValue(false);

    // Mock navigate
    navigateMock = vi.fn();
    mockUseNavigate.mockReturnValue(navigateMock);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  // Helper pour mocker token dans useAuthStore
  function mockAuthToken(token: string | null) {
    mockUseAuthStore.mockImplementation((selector: (s: { authToken: string | null }) => string | null) =>
      selector({ authToken: token })
    );
  }

  it('couvre la branche disable avec succès (status 204) : onToggle(false), dialog ferme, message de succès affiché', async () => {
    // 1) Token valide
    mockAuthToken('valid-token');

    // 2) Mock disableTwoFA renvoie { status: 204 }
    mockDisableTwoFA.mockResolvedValue({ status: 204 });

    // onToggle spy
    const onToggleMock = vi.fn();

    // 3) Render avec enabled=true pour pouvoir déclencher disable
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // 4) Ouvrir le dialog disable en cliquant sur le switch
    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });

    // 5) Attendre que le titre du dialog disable apparaisse
    await waitFor(() => {
      expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
    });

    // 6) Saisir un OTP valide dans le champ otp
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '123456' } });
    });

    // 7) Cliquer Confirm pour déclencher handleConfirm -> disable branch
    const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // 8) Vérifier que disableTwoFA a été appelé avec token et OTP
    await waitFor(() => {
      expect(mockDisableTwoFA).toHaveBeenCalledWith('valid-token', '123456');
    });

    // 9) Vérifier que onToggle(false) est appelé
    expect(onToggleMock).toHaveBeenCalledWith(false);

    // 10) Le dialog doit être fermé : titre plus dans le DOM
    await waitFor(() => {
      expect(screen.queryByText('dashboard.disable2faTitle')).toBeNull();
    });

    // 11) Ouvrir à nouveau l'accordéon pour voir le message de succès dans les détails
    const summaryButton = screen.getByRole('button', { name: /dashboard.twoFA/i });
    await act(async () => {
      fireEvent.click(summaryButton);
    });
    await waitFor(() => {
      // Le message success est affiché dans l'AccordionDetails
      expect(screen.getByText('dashboard.2faDisabled')).toBeInTheDocument();
    });
  });

  it('couvre la branche disable avec réponse inattendue status != 204 : setErrorMsg generic_error', async () => {
    mockAuthToken('valid-token');
    // Mock disableTwoFA renvoie status 400
    mockDisableTwoFA.mockResolvedValue({ status: 400 });

    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Ouvrir dialog disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    await waitFor(() => {
      expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
    });

    // Saisir OTP et cliquer Confirm
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '000000' } });
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.confirm' }));
    });

    // Doit afficher generic_error dans l'UI (errorMsg)
    await waitFor(() => {
      expect(screen.getByText('error:generic_error')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('couvre la branche disable avec axios error non twofa_invalid_code : setDialogErrorMsg getErrorMessage', async () => {
    mockAuthToken('valid-token');
    // Simuler axios error avec code spécifique
    const axiosErr: any = new Error('Test');
    axiosErr.isAxiosError = true;
    axiosErr.response = { data: { code: 'SOME_DIS_CODE' } };
    mockDisableTwoFA.mockRejectedValue(axiosErr);

    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Ouvrir dialog disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    await waitFor(() => {
      expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
    });

    // Saisir OTP et cliquer Confirm
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '111111' } });
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.confirm' }));
    });

    // Affiche l'erreur retournée par getErrorMessage
    await waitFor(() => {
      expect(screen.getByText('error:SOME_DIS_CODE')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('couvre la branche disable avec axios error twofa_invalid_code en mode otp : affiche errors.invalidOtp', async () => {
    mockAuthToken('valid-token');
    const axiosErr: any = new Error('Test');
    axiosErr.isAxiosError = true;
    axiosErr.response = { data: { code: 'twofa_invalid_code' } };
    mockDisableTwoFA.mockRejectedValue(axiosErr);

    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Ouvrir dialog disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    await waitFor(() => {
      expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
    });

    // Par défaut codeType="otp"
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '222222' } });
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.confirm' }));
    });

    // Affiche errors.invalidOtp
    await waitFor(() => {
      expect(screen.getByText('errors.invalidOtp')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('couvre la branche disable avec axios error twofa_invalid_code en mode recovery : affiche errors.invalidRecoveryCode', async () => {
    mockAuthToken('valid-token');
    const axiosErr: any = new Error('Test');
    axiosErr.isAxiosError = true;
    axiosErr.response = { data: { code: 'twofa_invalid_code' } };
    mockDisableTwoFA.mockRejectedValue(axiosErr);

    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Ouvrir dialog disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    await waitFor(() => {
      expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
    });

    // Bascule en recovery
    const useRecoveryBtn = screen.getByRole('button', { name: 'dashboard.useRecoveryCode' });
    await act(async () => {
      fireEvent.click(useRecoveryBtn);
    });
    await waitFor(() => {
      expect(screen.getByLabelText('dashboard.recoveryCode')).toBeInTheDocument();
    });

    // Saisir recovery code et cliquer Confirm
    const recInput = screen.getByLabelText('dashboard.recoveryCode');
    await act(async () => {
      fireEvent.change(recInput, { target: { value: 'WRONGCODE' } });
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.confirm' }));
    });

    // Affiche errors.invalidRecoveryCode
    await waitFor(() => {
      expect(screen.getByText('errors.invalidRecoveryCode')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('couvre la bascule otp <-> recovery nettoie otpCode et dialogErrorMsg', async () => {
    mockAuthToken('valid-token');
    // Simuler un rejet twofa_invalid_code pour générer erreur initiale
    const axiosErr: any = new Error('Test');
    axiosErr.isAxiosError = true;
    axiosErr.response = { data: { code: 'twofa_invalid_code' } };
    mockDisableTwoFA.mockRejectedValue(axiosErr);

    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Ouvrir dialog disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    await waitFor(() => {
      expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
    });

    // Bascule en recovery, fait échouer (OTP branch rejetée)
    const useRecoveryBtn = screen.getByRole('button', { name: 'dashboard.useRecoveryCode' });
    await act(async () => {
      fireEvent.click(useRecoveryBtn);
    });
    const recInput = await screen.findByLabelText('dashboard.recoveryCode');
    await act(async () => {
      fireEvent.change(recInput, { target: { value: 'X' } });
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.confirm' }));
    });
    await waitFor(() => {
      expect(screen.getByText('errors.invalidRecoveryCode')).toBeInTheDocument();
    });

    // Puis bascule en OTP : le champ otp doit être vidé et l’erreur disparaître
    const useOtpBtn = screen.getByRole('button', { name: 'dashboard.useOtp' });
    await act(async () => {
      fireEvent.click(useOtpBtn);
    });
    const otpInput2 = await screen.findByLabelText('dashboard.otpCode');
    expect((otpInput2 as HTMLInputElement).value).toBe('');
    expect(screen.queryByText('errors.invalidRecoveryCode')).toBeNull();
  });

  it('navigue vers login si token null en ouvrant disable', async () => {
    // Token null => handleToggle navigue vers login immédiatement
    mockAuthToken(null);
    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('navigue vers login si token null au moment de confirmer disable', async () => {
    // 1) Commence avec token valide pour ouvrir dialog
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    await waitFor(() => {
      expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
    });

    // 2) Avant Confirm, token devient null
    mockAuthToken(null);

    // 3) Saisir OTP non vide
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '999999' } });
    });

    // 4) Cliquer Confirm => navigation vers login
    const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('handleDialogClose en mode enable_success ne déclenche pas onToggle(false)', async () => {
    // 1) Mocker token et services pour simuler activation réussie
    mockAuthToken('valid-token');
    const navigateMock2 = vi.fn();
    mockUseNavigate.mockReturnValue(navigateMock2);

    // Mocker enableTwoFA pour obtenir QR + secret
    const fakeQrUrl = 'http://example.com/qr.png';
    const fakeSecret = 'SECRET123';
    mockEnableTwoFA.mockResolvedValue({
      status: 200,
      data: { qrCodeUrl: fakeQrUrl, secret: fakeSecret },
    });
    // Mocker confirmTwoFA pour renvoyer recovery_codes => activation réussie
    const fakeRecovery = ['code1', 'code2'];
    mockConfirmTwoFA.mockResolvedValue({
      status: 200,
      data: { recovery_codes: fakeRecovery },
    });

    const onToggleMock = vi.fn();
    const { container } = render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    // 2) Démarrer l’activation
    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });
    // Attendre l'ouverture du dialog prepare
    await waitFor(() => {
      expect(screen.getByText('dashboard.enable2faTitle')).toBeInTheDocument();
    });
    // Vérifier QR et secret affichés (optionnel)
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`dashboard\\.secret: ${fakeSecret}`))).toBeInTheDocument();

    // 3) Cliquer Next pour passer en enable_confirm
    const nextBtn = screen.getByRole('button', { name: 'dashboard.next' });
    await act(async () => {
      fireEvent.click(nextBtn);
    });
    // Attendre champ OTP
    const otpInput = await screen.findByLabelText('dashboard.otpCode');
    // Saisir OTP valide
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '123456' } });
    });
    // Cliquer Confirm pour déclencher confirmTwoFA et passer en enable_success
    const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    // Attendre que onToggle(true) ait été appelé
    await waitFor(() => {
      expect(onToggleMock).toHaveBeenCalledWith(true);
    });
    // Vérifier que les recovery codes sont affichés
    for (const code of fakeRecovery) {
      expect(screen.getByText(code)).toBeInTheDocument();
    }
    // 4) Cliquer sur "Done" pour fermer le dialog en mode enable_success
    const doneBtn = screen.getByRole('button', { name: 'dashboard.done' });
    await act(async () => {
      fireEvent.click(doneBtn);
    });
    // On s’assure que le dialog est fermé
    await waitFor(() => {
      expect(screen.queryByText('dashboard.recoveryCodesTitle')).toBeNull();
    });
    // 5) Vérifier que handleDialogClose n’a pas ré-invoqué onToggle(false)
    //    onToggleMock ne doit avoir été appelé qu’une seule fois (la fois pour true)
    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });
});
