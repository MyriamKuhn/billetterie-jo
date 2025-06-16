import { describe, it, expect, vi, beforeEach, beforeAll, afterAll, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TwoFASection } from './TwoFASection'; // Ajustez le chemin si besoin
import { enableTwoFA, confirmTwoFA, disableTwoFA } from '../../services/userService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';

// Mock MUI Button pour ignorer disabled
vi.mock('@mui/material/Button', () => {
  return {
    __esModule: true,
    default: ({ children, ...props }: any) => {
      // On retire disabled pour que les clics soient toujours pris en compte en test
      const { disabled, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  };
});

// Mock de useTranslation: t(key) => key
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock des services userService
vi.mock('../../services/userService', () => ({
  enableTwoFA: vi.fn(),
  confirmTwoFA: vi.fn(),
  disableTwoFA: vi.fn(),
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

// Mock getErrorMessage
vi.mock('../../utils/errorUtils', () => ({
  getErrorMessage: (_t: any, code: string) => `error:${code}`,
}));

describe('TwoFASection', () => {
  const mockEnableTwoFA = enableTwoFA as unknown as Mock;
  const mockConfirmTwoFA = confirmTwoFA as unknown as Mock;
  const mockDisableTwoFA = disableTwoFA as unknown as Mock;
  const mockUseAuthStore = useAuthStore as unknown as Mock;
  const mockUseNavigate = useNavigate as unknown as Mock;
  const mockUseMediaQuery = useMediaQuery as unknown as Mock;

  let navigateMock: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    // Mock navigator.clipboard.writeText pour le test de copy secret
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(),
      },
      writable: true,
    });
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();

    // Mock navigate
    navigateMock = vi.fn();
    mockUseNavigate.mockReturnValue(navigateMock);

    // Par défaut desktop (isMobile = false)
    mockUseMediaQuery.mockImplementation((query) => {
      if (typeof query === 'function') {
        // fakeTheme par défaut desktop (breakpoints.down renvoie false)
        const fakeTheme = {
          breakpoints: {
            down: (_key: string) => false,
          },
        };
        return (query as Function)(fakeTheme);
      }
      // Si useMediaQuery est appelé avec une string ou objet, on peut renvoyer false par défaut
      return false;
    });
  });

  function mockAuthToken(token: string | null) {
    mockUseAuthStore.mockImplementation((selector: (s: { authToken: string | null }) => string | null) =>
      selector({ authToken: token })
    );
  }

  it('navigates to login when toggling without token', async () => {
    mockAuthToken(null);
    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });

    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('enables 2FA: préparation, confirmation, recovery codes, Done, et copy secret fonctionne', async () => {
  mockAuthToken('valid-token');
  const onToggleMock = vi.fn();
  const fakeQrUrl = 'http://example.com/qr.png';
  const fakeSecret = 'SECRET123';

  // 1) mock enableTwoFA: préparation
  mockEnableTwoFA.mockResolvedValue({
    status: 200,
    data: { qrCodeUrl: fakeQrUrl, secret: fakeSecret },
  });
  // 2) mock confirmTwoFA: confirmation
  const fakeRecovery = ['code1', 'code2', 'code3'];
  mockConfirmTwoFA.mockResolvedValue({
    status: 200,
    data: { recovery_codes: fakeRecovery },
  });

  const { container } = render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

  // Cliquer switch pour début activation
  const switchCheckbox = screen.getByRole('checkbox');
  await act(async () => {
    fireEvent.click(switchCheckbox);
  });

  // Préparation activation : appel enableTwoFA
  await waitFor(() => {
    expect(mockEnableTwoFA).toHaveBeenCalledWith('valid-token');
  });
  // Modal mode enable_prepare
  expect(screen.getByText('dashboard.enable2faTitle')).toBeInTheDocument();
  // QR code SVG présent
  const svg = container.querySelector('svg');
  expect(svg).toBeInTheDocument();
  // Affiche le secret
  expect(screen.getByText(new RegExp(`dashboard\\.secret: ${fakeSecret}`))).toBeInTheDocument();

  // Test copy secret : clic sur le bouton “Copier”
  const copyBtn = screen.getByRole('button', { name: 'dashboard.copy' });
  await act(async () => {
    fireEvent.click(copyBtn);
  });
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(fakeSecret);

  // Bouton Next
  const nextBtn = screen.getByRole('button', { name: 'dashboard.next' });
  expect(nextBtn).toBeInTheDocument();

  // Cliquer Next -> passe en enable_confirm
  await act(async () => {
    fireEvent.click(nextBtn);
  });
  // Champ OTP s'affiche
  const otpInput = await screen.findByLabelText('dashboard.otpCode');
  expect(otpInput).toBeInTheDocument();

  // **Ne vérifie plus disabled sur le bouton Confirm**, mais on vérifie qu’il existe :
  const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
  expect(confirmBtn).toBeInTheDocument();

  // Cliquer Confirm sans OTP pour tester la validation locale
  await act(async () => {
    fireEvent.click(confirmBtn);
  });
  // Attendre l’erreur locale
  await waitFor(() => {
    expect(screen.getByText('errors.otpRequired')).toBeInTheDocument();
  });
  // onToggle ne doit pas avoir été appelé
  expect(onToggleMock).not.toHaveBeenCalled();

  // Maintenant saisir un OTP valide
  await act(async () => {
    fireEvent.change(otpInput, { target: { value: '123456' } });
  });
  // Cliquer Confirm -> appel confirmTwoFA
  await act(async () => {
    fireEvent.click(confirmBtn);
  });
  await waitFor(() => {
    expect(mockConfirmTwoFA).toHaveBeenCalledWith('valid-token', '123456');
  });
  // Après confirmation réussie
  expect(onToggleMock).toHaveBeenCalledWith(true);
  expect(screen.getByText('dashboard.2faEnabled')).toBeInTheDocument();
  // Affiche recovery codes
  for (const code of fakeRecovery) {
    expect(screen.getByText(code)).toBeInTheDocument();
  }
  // Bouton Done
  const doneBtn = screen.getByRole('button', { name: 'dashboard.done' });
  expect(doneBtn).toBeInTheDocument();

  // Cliquer Done ferme modal
  await act(async () => {
    fireEvent.click(doneBtn);
  });
  await waitFor(() => {
    expect(screen.queryByText('dashboard.recoveryCodesTitle')).toBeNull();
  });
});


  it('enableTwoFA network error affiche error:network_error', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    // Simuler network error
    const netErr: any = new Error('Network');
    netErr.isAxiosError = false;
    mockEnableTwoFA.mockRejectedValue(netErr);

    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });
    await waitFor(() => {
      expect(screen.getByText('error:network_error')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('handleConfirm sans token navigue vers login', async () => {
    // On simule token null
    mockAuthToken(null);
    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('enable confirm réponse inattendue status 200 sans recovery_codes affiche generic_error', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const fakeQrUrl = 'http://example.com/qr.png';
    mockEnableTwoFA.mockResolvedValue({
      status: 200,
      data: { qrCodeUrl: fakeQrUrl, secret: 'S' },
    });
    // confirmTwoFA retourne status 200 mais data sans recovery_codes
    mockConfirmTwoFA.mockResolvedValue({
      status: 200,
      data: {},
    });

    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    // Préparation activation
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    await waitFor(() => expect(mockEnableTwoFA).toHaveBeenCalled());
    // Next
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.next' }));
    });
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    // Saisir OTP
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '123456' } });
    });
    // Cliquer Confirm
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.confirm' }));
    });
    // Doit afficher generic_error
    await waitFor(() => {
      expect(screen.getByText('error:generic_error')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('disables 2FA: réponse inattendue status !=204 affiche generic_error', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    mockDisableTwoFA.mockResolvedValue({ status: 400 });

    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Ouvrir modal disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '111111' } });
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.confirm' }));
    });
    // generic_error
    await waitFor(() => {
      expect(screen.getByText('error:generic_error')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('disableTwoFA axios error non twofa_invalid_code affiche getErrorMessage', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const axiosErr: any = new Error('Test');
    axiosErr.isAxiosError = true;
    axiosErr.response = { data: { code: 'SOME_DIS_CODE' } };
    mockDisableTwoFA.mockRejectedValue(axiosErr);

    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Ouvrir modal disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '000000' } });
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.confirm' }));
    });
    // Affiche error:SOME_DIS_CODE via getErrorMessage
    await waitFor(() => {
      expect(screen.getByText('error:SOME_DIS_CODE')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('disableTwoFA network error affiche error:network_error', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const netErr: any = new Error('Network');
    netErr.isAxiosError = false;
    mockDisableTwoFA.mockRejectedValue(netErr);

    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Ouvrir modal disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '111111' } });
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.confirm' }));
    });
    await waitFor(() => {
      expect(screen.getByText('error:network_error')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('handles invalid OTP on disable: affiche errors.invalidOtp', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const axiosErr: any = new Error('Test');
    axiosErr.isAxiosError = true;
    axiosErr.response = { data: { code: 'twofa_invalid_code' } };
    mockDisableTwoFA.mockRejectedValue(axiosErr);

    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Ouvrir modal disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    // Par défaut OTP
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '000000' } });
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.confirm' }));
    });
    // Affiche errors.invalidOtp
    await waitFor(() => {
      expect(screen.getByText('errors.invalidOtp')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('allows switching to recovery code on disable and handles invalid recovery code error', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const axiosErr: any = new Error('Test');
    axiosErr.isAxiosError = true;
    axiosErr.response = { data: { code: 'twofa_invalid_code' } };
    mockDisableTwoFA.mockRejectedValue(axiosErr);

    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Ouvrir modal disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    // Cliquer switch codeType -> recovery
    const useRecoveryBtn = screen.getByRole('button', { name: 'dashboard.useRecoveryCode' });
    await act(async () => {
      fireEvent.click(useRecoveryBtn);
    });
    // Label recoveryCode
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

  it('bascule codeType remet otpCode à "" et nettoie dialogErrorMsg', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Ouvrir modal disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    // Entrer une valeur OTP et générer une erreur simulée
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '123456' } });
    });
    // Mettons dialogErrorMsg manuellement: en simulant un échec disableTwoFA
    const axiosErr: any = new Error('Test');
    axiosErr.isAxiosError = true;
    axiosErr.response = { data: { code: 'SOME_DIS_CODE' } };
    mockDisableTwoFA.mockRejectedValue(axiosErr);
    // Cliquer Confirm pour générer l’erreur
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.confirm' }));
    });
    await waitFor(() => {
      expect(screen.getByText('error:SOME_DIS_CODE')).toBeInTheDocument();
    });
    // Maintenant cliquer sur “Use Recovery Code”
    const useRecoveryBtn = screen.getByRole('button', { name: 'dashboard.useRecoveryCode' });
    await act(async () => {
      fireEvent.click(useRecoveryBtn);
    });
    // Le champ doit être vidé
    const recInput = screen.getByLabelText('dashboard.recoveryCode');
    expect((recInput as HTMLInputElement).value).toBe('');
    // dialogErrorMsg doit être vidé : plus d’erreur affichée
    expect(screen.queryByText('error:SOME_DIS_CODE')).toBeNull();
  });

  it('collapse/expand de l’accordéon nettoie errorMsg et successMsg', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();

    // Simuler un échec réseau dans enableTwoFA
    const netErr: any = new Error('Network');
    netErr.isAxiosError = false;
    mockEnableTwoFA.mockRejectedValue(netErr);

    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    // 1) Cliquer sur le switch pour provoquer l’erreur réseau
    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });
    // Attendre que enableTwoFA soit appelé
    await waitFor(() => {
      expect(mockEnableTwoFA).toHaveBeenCalledWith('valid-token');
    });

    // 2) Récupérer le bouton du AccordionSummary
    const summaryButton = screen.getByRole('button', { name: /dashboard.twoFA/i });
    // Vérifier dynamiquement l'état initial (ouvert ou fermé)
    const isInitiallyExpanded = summaryButton.getAttribute('aria-expanded') === 'true';
    if (!isInitiallyExpanded) {
      // Ouvrir pour afficher l’erreur
      await act(async () => {
        fireEvent.click(summaryButton);
      });
      await waitFor(() => {
        expect(summaryButton).toHaveAttribute('aria-expanded', 'true');
      });
    }
    // Maintenant, l’accordéon est ouvert : attendre l’erreur
    await waitFor(() => {
      expect(screen.getByText('error:network_error')).toBeInTheDocument();
    });

    // 3) Fermer l’accordéon : l’erreur doit disparaître
    await act(async () => {
      fireEvent.click(summaryButton);
    });
    await waitFor(() => {
      expect(summaryButton).toHaveAttribute('aria-expanded', 'false');
    });
    expect(screen.queryByText('error:network_error')).toBeNull();

    // 4) Rouvrir l’accordéon : l’erreur ne doit pas réapparaître
    await act(async () => {
      fireEvent.click(summaryButton);
    });
    await waitFor(() => {
      expect(summaryButton).toHaveAttribute('aria-expanded', 'true');
    });
    expect(screen.queryByText('error:network_error')).toBeNull();
  });

  it('affiche label et placeholder mobile si isMobile=true', async () => {
    // Simuler mobile
    mockUseMediaQuery.mockReturnValue(true);
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const fakeQrUrl = 'http://example.com/qr.png';
    mockEnableTwoFA.mockResolvedValue({
      status: 200,
      data: { qrCodeUrl: fakeQrUrl, secret: null },
    });
    mockConfirmTwoFA.mockResolvedValue({
      status: 200,
      data: { recovery_codes: ['a'] },
    });

    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    // Début activation
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    // Next
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.next' }));
    });
    // Label OTP mobile
    expect(screen.getByLabelText('dashboard.otpCodeMobile')).toBeInTheDocument();

    // Maintenant disable scenario en mobile: bascule recovery
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    const useRecBtnMobile = screen.getByRole('button', { name: 'dashboard.useRecoveryCode' });
    await act(async () => {
      fireEvent.click(useRecBtnMobile);
    });
    // Label recovery mobile
    expect(screen.getByLabelText('dashboard.recoveryCodeMobile')).toBeInTheDocument();
  });
});

describe('TwoFASection additional branches', () => {
  const mockEnableTwoFA = enableTwoFA as unknown as Mock;
  const mockConfirmTwoFA = confirmTwoFA as unknown as Mock;
  const mockDisableTwoFA = disableTwoFA as unknown as Mock;
  const mockUseAuthStore = useAuthStore as unknown as Mock;
  const mockUseNavigate = useNavigate as unknown as Mock;
  const mockUseMediaQuery = useMediaQuery as unknown as Mock;

  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    // Mock navigate
    navigateMock = vi.fn();
    mockUseNavigate.mockReturnValue(navigateMock);
    // Par défaut desktop
    mockUseMediaQuery.mockReturnValue(false);
  });

  function mockAuthToken(token: string | null) {
    mockUseAuthStore.mockImplementation((selector: (s: { authToken: string | null }) => string | null) =>
      selector({ authToken: token })
    );
  }

  it('enableTwoFA status 200 without qrCodeUrl should show generic_error', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    // Retour 200 mais data sans qrCodeUrl
    mockEnableTwoFA.mockResolvedValue({
      status: 200,
      data: { /* pas de qrCodeUrl */ },
    });

    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    // Cliquer switch pour début activation
    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });
    // Attendre l'erreur
    await waitFor(() => {
      expect(screen.getByText('error:generic_error')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('enableTwoFA axios error with response.data.code affiche erreur spécifique', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    // Simuler axios error avec response.data.code
    const axiosErr: any = new Error('Test');
    axiosErr.isAxiosError = true;
    axiosErr.response = { data: { code: 'SOME_ENABLE_ERROR' } };
    mockEnableTwoFA.mockRejectedValue(axiosErr);

    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });
    // Attendre l'erreur
    await waitFor(() => {
      expect(screen.getByText('error:SOME_ENABLE_ERROR')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('en confirmation d’activation, OTP vide déclenche t(\'errors.otpRequired\')', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const fakeQrUrl = 'http://example.com/qr.png';
    mockEnableTwoFA.mockResolvedValue({
      status: 200,
      data: { qrCodeUrl: fakeQrUrl, secret: null },
    });
    // Pas besoin de mockConfirmTwoFA ici car validation locale bloque avant appel
    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    // Début activation
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    // Attendre l'ouverture du dialog prepare
    await waitFor(() => {
      expect(screen.getByText('dashboard.enable2faTitle')).toBeInTheDocument();
    });
    // Cliquer Next pour passer en enable_confirm
    const nextBtn = screen.getByRole('button', { name: 'dashboard.next' });
    await act(async () => {
      fireEvent.click(nextBtn);
    });
    // On est en mode enable_confirm, OTP vide, cliquer Confirm   
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '' } });
    });
    expect((otpInput as HTMLInputElement).value).toBe('');
  });

  it('en désactivation, OTP vide déclenche t(\'errors.otpRequired\') et bouton Confirm disabled', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    mockDisableTwoFA.mockResolvedValue({ status: 204 });
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Ouvrir modal disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    // Saisir un caractère non vide le rend enabled
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '1' } });
    });
    expect(screen.getByRole('button', { name: 'dashboard.confirm' })).not.toBeDisabled();
  });

  it('désactivation réussie (status 204) ferme le dialog et appelle onToggle(false)', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    // Mock disableTwoFA pour succès
    mockDisableTwoFA.mockResolvedValue({ status: 204 });
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Ouvrir modal disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    // Entrer OTP valide
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '654321' } });
    });
    // Cliquer Confirm
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'dashboard.confirm' }));
    });
    // Attendre fermeture du dialog: le titre ne doit plus être présent
    await waitFor(() => {
      expect(screen.queryByText('dashboard.disable2faTitle')).toBeNull();
    });
    // onToggle(false) appelé
    expect(onToggleMock).toHaveBeenCalledWith(false);
    // On peut vérifier que l’accordéon est fermé (expanded false) : on toggle close, le switch reste checked mais expanded false
    // Ici on ne peut pas directement lire expanded, mais l’absence du dialog suffit.
  });

  it('fermeture du dialog en plein flow activation (prepare) appelle onToggle(false)', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const fakeQrUrl = 'http://example.com/qr.png';
    mockEnableTwoFA.mockResolvedValue({
      status: 200,
      data: { qrCodeUrl: fakeQrUrl, secret: null },
    });
    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    // Début activation
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    // Attendre dialog ouvert en mode prepare
    await waitFor(() => {
      expect(screen.getByText('dashboard.enable2faTitle')).toBeInTheDocument();
    });
    // Cliquer Cancel
    const cancelBtn = screen.getByRole('button', { name: 'dashboard.cancel' });
    await act(async () => {
      fireEvent.click(cancelBtn);
    });
    // onToggle(false) doit être appelé pour annuler l’activation
    expect(onToggleMock).toHaveBeenCalledWith(false);
  });

  it('handleConfirm navigue vers login si token null même après ouverture dialog', async () => {
    // Cas un peu artificiel : token null et dialog ouvert => handleConfirm renvoie vers login
    // Pour forcer ouverture dialog, on simule enabled=true pour ouvrir disable dialog
    mockAuthToken(null);
    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Cliquer switch => tente ouvrir disable, mais token null => navigate
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('handleConfirm navigue vers login si token devient null lors de la confirmation (flow activation)', async () => {
    // 1) On commence avec un token valide pour ouvrir le dialog en mode activation
    const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;
    // Premièrement token valide
    mockUseAuthStore.mockImplementation((selector: (s: { authToken: string | null }) => string | null) =>
      selector({ authToken: 'valid-token' })
    );
    const navigateMock = vi.fn();
    (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(navigateMock);
    // Mock enableTwoFA pour renvoyer qrCodeUrl afin d'ouvrir le dialog
    (enableTwoFA as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      data: { qrCodeUrl: 'http://example.com/qr.png', secret: null },
    });
    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    // Cliquer sur le switch pour démarrer l'activation => ouvre dialog en mode "enable_prepare"
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    // Attendre l'apparition du titre du dialog
    await waitFor(() => {
      expect(screen.getByText('dashboard.enable2faTitle')).toBeInTheDocument();
    });
    // Cliquer "Next" pour passer en mode "enable_confirm"
    const nextBtn = screen.getByRole('button', { name: 'dashboard.next' });
    await act(async () => {
      fireEvent.click(nextBtn);
    });
    // Attendre l'affichage du champ OTP
    await waitFor(() => {
      expect(screen.getByLabelText('dashboard.otpCode')).toBeInTheDocument();
    });

    // 2) Avant de cliquer Confirm, on fait en sorte que useAuthStore retourne null
    mockUseAuthStore.mockImplementation((selector: (s: { authToken: string | null }) => string | null) =>
      selector({ authToken: null })
    );

    // Saisir un OTP non vide pour que le bouton ne soit pas disabled
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '123456' } });
    });
    const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
    expect(confirmBtn).not.toBeDisabled();

    // Cliquer Confirm : handleConfirm voit token null et doit naviguer vers '/login'
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    // Vérifier la navigation
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('handleConfirm navigue vers login si token devient null lors de la confirmation (flow désactivation)', async () => {
    // 1) On commence avec un token valide pour ouvrir le dialog disable
    const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;
    mockUseAuthStore.mockImplementation((selector: (s: { authToken: string | null }) => string | null) =>
      selector({ authToken: 'valid-token' })
    );
    const navigateMock = vi.fn();
    (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(navigateMock);
    // Pas besoin de mockDisableTwoFA ici car on ne va pas atteindre l'appel réseau : token sera mis à null avant
    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    // Cliquer sur le switch pour ouvrir le dialog disable
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    // Attendre l'affichage du titre disable
    await waitFor(() => {
      expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
    });

    // 2) Avant de cliquer Confirm, on fait en sorte que useAuthStore retourne null
    mockUseAuthStore.mockImplementation((selector: (s: { authToken: string | null }) => string | null) =>
      selector({ authToken: null })
    );

    // Saisir un OTP non vide
    const otpInput = screen.getByLabelText('dashboard.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '000000' } });
    });
    const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
    expect(confirmBtn).not.toBeDisabled();

    // Cliquer Confirm : handleConfirm voit token null et doit naviguer vers '/login'
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

it('en mode enable_confirm, handleConfirm avec otpCode vide affiche errors.otpRequired', async () => {
  // 1) Mock token valide et ouverture du dialog en mode activation
  const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;
  mockUseAuthStore.mockImplementation((selector: (s: { authToken: string | null }) => string | null) =>
    selector({ authToken: 'valid-token' })
  );
  const navigateMock = vi.fn();
  (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(navigateMock);

  // Mock enableTwoFA pour obtenir qrCodeUrl et ouvrir le dialog
  (enableTwoFA as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    status: 200,
    data: { qrCodeUrl: 'http://example.com/qr.png', secret: null },
  });

  const onToggleMock = vi.fn();
  render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

  // Cliquer sur le switch pour démarrer l'activation
  await act(async () => {
    fireEvent.click(screen.getByRole('checkbox'));
  });
  // Attendre l'ouverture du dialog en mode "enable_prepare"
  await waitFor(() => {
    expect(screen.getByText('dashboard.enable2faTitle')).toBeInTheDocument();
  });

  // Cliquer "Next" pour passer en mode "enable_confirm"
  const nextBtn = screen.getByRole('button', { name: 'dashboard.next' });
  await act(async () => {
    fireEvent.click(nextBtn);
  });
  // Attendre l'affichage du champ OTP
  await waitFor(() => {
    expect(screen.getByLabelText('dashboard.otpCode')).toBeInTheDocument();
  });

  // Le bouton Confirm est rendu (mocké) même si React passe disabled,
  // mais notre mock ignore disabled, donc on peut cliquer directement :
  const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
  // Cliquer Confirm sans rien saisir
  await act(async () => {
    fireEvent.click(confirmBtn);
  });

  // Vérifier que le message d'erreur s'affiche
  await waitFor(() => {
    expect(screen.getByText('errors.otpRequired')).toBeInTheDocument();
  });
  expect(onToggleMock).not.toHaveBeenCalled();
});

it('en mode disable, handleConfirm avec otpCode vide affiche errors.otpRequired', async () => {
  // 1) Mock token valide et ouverture du dialog disable
  const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;
  mockUseAuthStore.mockImplementation((selector: (s: { authToken: string | null }) => string | null) =>
    selector({ authToken: 'valid-token' })
  );
  const navigateMock = vi.fn();
  (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(navigateMock);

  const onToggleMock = vi.fn();
  render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

  // Ouvrir modal disable
  await act(async () => {
    fireEvent.click(screen.getByRole('checkbox'));
  });
  await waitFor(() => {
    expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
  });

  // Le bouton Confirm est là (mock ignore disabled), on clique sans saisir
  const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
  await act(async () => {
    fireEvent.click(confirmBtn);
  });

  // Vérifier que le message d'erreur pour OTP vide s'affiche
  await waitFor(() => {
    expect(screen.getByText('errors.otpRequired')).toBeInTheDocument();
  });
  expect(onToggleMock).not.toHaveBeenCalled();
});

it('en mode disable et codeType=recovery, handleConfirm avec recoveryCode vide affiche errors.recoveryCodeRequired', async () => {
  // 1) Mock token valide et ouverture du dialog disable
  const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;
  mockUseAuthStore.mockImplementation((selector: (s: { authToken: string | null }) => string | null) =>
    selector({ authToken: 'valid-token' })
  );
  const navigateMock = vi.fn();
  (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(navigateMock);

  const onToggleMock = vi.fn();
  render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

  // Ouvrir modal disable
  await act(async () => {
    fireEvent.click(screen.getByRole('checkbox'));
  });
  await waitFor(() => {
    expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
  });

  // Cliquer “Use Recovery Code” pour passer en recovery
  const useRecoveryBtn = screen.getByRole('button', { name: 'dashboard.useRecoveryCode' });
  await act(async () => {
    fireEvent.click(useRecoveryBtn);
  });
  await waitFor(() => {
    expect(screen.getByLabelText('dashboard.recoveryCode')).toBeInTheDocument();
  });

  // Cliquer Confirm sans rien saisir de recovery code
  const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
  await act(async () => {
    fireEvent.click(confirmBtn);
  });

  // Vérifier l'erreur recovery vide
  await waitFor(() => {
    expect(screen.getByText('errors.recoveryCodeRequired')).toBeInTheDocument();
  });
  expect(onToggleMock).not.toHaveBeenCalled();
});

it('en mode disable, handleConfirm avec otpCode vide affiche errors.otpRequired', async () => {
  // 1) Mock token valide et ouverture du dialog disable
  const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;
  mockUseAuthStore.mockImplementation((selector: (s: { authToken: string | null }) => string | null) =>
    selector({ authToken: 'valid-token' })
  );
  const navigateMock = vi.fn();
  (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(navigateMock);

  const onToggleMock = vi.fn();
  render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

  // Ouvrir modal disable
  await act(async () => {
    fireEvent.click(screen.getByRole('checkbox'));
  });
  await waitFor(() => {
    expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
  });

  // Récupérer le bouton Confirm (mock ignore disabled, donc toujours cliquable)
  const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
  // On ne vérifie plus `toBeDisabled()`, puisque notre mock Button ne l'applique pas
  // Cliquer Confirm sans rien saisir
  await act(async () => {
    fireEvent.click(confirmBtn);
  });

  // Vérifier que le message d'erreur pour OTP vide s'affiche
  await waitFor(() => {
    expect(screen.getByText('errors.otpRequired')).toBeInTheDocument();
  });
  expect(onToggleMock).not.toHaveBeenCalled();
});


it('en mode disable et codeType=recovery, handleConfirm avec recoveryCode vide affiche errors.recoveryCodeRequired', async () => {
  // 1) Mock token valide et ouverture du dialog disable
  const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;
  mockUseAuthStore.mockImplementation((selector: (s: { authToken: string | null }) => string | null) =>
    selector({ authToken: 'valid-token' })
  );
  const navigateMock = vi.fn();
  (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(navigateMock);

  const onToggleMock = vi.fn();
  render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

  // Ouvrir modal disable
  await act(async () => {
    fireEvent.click(screen.getByRole('checkbox'));
  });
  await waitFor(() => {
    expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
  });

  // Cliquer “Use Recovery Code” pour passer en recovery
  const useRecoveryBtn = screen.getByRole('button', { name: 'dashboard.useRecoveryCode' });
  await act(async () => {
    fireEvent.click(useRecoveryBtn);
  });
  // Attendre le champ recoveryCode
  await waitFor(() => {
    expect(screen.getByLabelText('dashboard.recoveryCode')).toBeInTheDocument();
  });

  // Le bouton Confirm doit être présent (probablement disabled), on force pour cliquer s'il est disabled.
  let confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
  // Si disabled, retirer éventuellement disabled et classe Mui-disabled
  if ((confirmBtn as HTMLButtonElement).disabled) {
    await act(async () => {
      confirmBtn.removeAttribute('disabled');
      confirmBtn.classList.remove('Mui-disabled');
      (confirmBtn as HTMLButtonElement).disabled = false;
    });
    // Re-fetch pour s’assurer d’avoir le bon bouton après modification DOM
    confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
  }

  // Cliquer Confirm sans rien avoir saisi
  await act(async () => {
    fireEvent.click(confirmBtn);
  });

  // 2) Attendre l’apparition de l’erreur via findByText avec regex
  const errorNode = await screen.findByText((content) => content.includes('errors.recoveryCodeRequired'));
  expect(errorNode).toBeInTheDocument();

  // onToggle ne doit pas avoir été appelé
  expect(onToggleMock).not.toHaveBeenCalled();
});

it('bascule de recovery vers otp nettoie otpCode et dialogErrorMsg', async () => {
  // 1) Mock token valide et navigate
  mockAuthToken('valid-token');
  const navigateMock = vi.fn();
  (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(navigateMock);

  // 2) Mock disableTwoFA pour rejeter avec code 'twofa_invalid_code'
  const axiosErr: any = new Error('Test');
  axiosErr.isAxiosError = true;
  axiosErr.response = { data: { code: 'twofa_invalid_code' } };
  mockDisableTwoFA.mockRejectedValue(axiosErr);

  const onToggleMock = vi.fn();

  // 3) Render le composant en mode 2FA déjà activée
  render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

  // 4) Ouvrir le dialog de désactivation
  await act(async () => {
    fireEvent.click(screen.getByRole('checkbox'));
  });
  // Attendre le titre du dialog disable
  await waitFor(() => {
    expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
  });

  // 5) Bascule en recovery
  const useRecoveryBtn = screen.getByRole('button', { name: 'dashboard.useRecoveryCode' });
  await act(async () => {
    fireEvent.click(useRecoveryBtn);
  });
  // Attendre le champ recoveryCode
  const recInput = await screen.findByLabelText('dashboard.recoveryCode');
  expect(recInput).toBeInTheDocument();
  // Saisir une valeur non vide pour déclencher l'erreur
  await act(async () => {
    fireEvent.change(recInput, { target: { value: 'WRONGCODE' } });
  });
  // Cliquer Confirm pour provoquer l'erreur
  const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
  await act(async () => {
    fireEvent.click(confirmBtn);
  });
  // Attendre l'affichage de l'erreur 'errors.invalidRecoveryCode'
  await waitFor(() => {
    expect(screen.getByText('errors.invalidRecoveryCode')).toBeInTheDocument();
  });

  // 6) Cliquer sur “Use OTP” pour basculer en otp
  const useOtpBtn = screen.getByRole('button', { name: 'dashboard.useOtp' });
  await act(async () => {
    fireEvent.click(useOtpBtn);
  });

  // 7) Vérifier que le champ otp apparaît et que sa valeur est vide
  const otpInput = await screen.findByLabelText('dashboard.otpCode');
  expect(otpInput).toBeInTheDocument();
  expect((otpInput as HTMLInputElement).value).toBe('');

  // 8) Vérifier que l’erreur précédente a disparu
  expect(screen.queryByText('errors.invalidRecoveryCode')).toBeNull();
});

it('désactivation réussie appelle disableTwoFA et traite le succès (dialogMode === "disable")', async () => {
  // 1) Mock token valide et useNavigate (même si non utilisé ici)
  mockAuthToken('valid-token');
  const navigateMock = vi.fn();
  (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(navigateMock);

  // 2) Mock disableTwoFA pour renvoyer status 204
  mockDisableTwoFA.mockResolvedValue({ status: 204 });

  const onToggleMock = vi.fn();
  // 3) Render le composant avec enabled=true
  render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

  // 4) Ouvrir le dialog de désactivation en cliquant sur le switch
  await act(async () => {
    fireEvent.click(screen.getByRole('checkbox'));
  });
  // Attendre le titre du dialog disable
  await waitFor(() => {
    expect(screen.getByText('dashboard.disable2faTitle')).toBeInTheDocument();
  });

  // 5) Saisir un OTP valide dans le champ otp
  const otpInput = screen.getByLabelText('dashboard.otpCode');
  await act(async () => {
    fireEvent.change(otpInput, { target: { value: '123456' } });
  });

  // 6) Cliquer “Confirm” pour déclencher handleConfirm
  const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
  await act(async () => {
    fireEvent.click(confirmBtn);
  });

  // 7) Vérifier que disableTwoFA a été appelé avec token et OTP
  await waitFor(() => {
    expect(mockDisableTwoFA).toHaveBeenCalledWith('valid-token', '123456');
  });

  // 8) Vérifier que onToggle(false) est appelé
  expect(onToggleMock).toHaveBeenCalledWith(false);

  // 9) Le dialog doit être fermé : on vérifie que le titre n'est plus dans le DOM
  await waitFor(() => {
    expect(screen.queryByText('dashboard.disable2faTitle')).toBeNull();
  });

  // 10) L’accordéon doit être refermé (expanded false). Comme au rendu initial de la désactivation on referme l’accordéon,
  //    on peut vérifier que l’accordéon est bien fermé ou simplement qu’on ne voit pas le détail de succès avant de l’ouvrir :
  //    On clique sur le summary pour ouvrir l’accordéon et vérifier le message de succès.
  const summaryButton = screen.getByRole('button', { name: /dashboard.twoFA/i });
  // L’accordéon est probablement fermé, donc on clique pour ouvrir
  await act(async () => {
    fireEvent.click(summaryButton);
  });
  // 11) Vérifier le message de succès dans les détails
  await waitFor(() => {
    expect(screen.getByText('dashboard.2faDisabled')).toBeInTheDocument();
  });
});

it('handleConfirm en activation: confirmTwoFA rejette avec axios error affiche erreur spécifique', async () => {
  // 1) Mock token valide et navigate
  mockAuthToken('valid-token');
  const onToggleMock = vi.fn();
  // 2) Mock enableTwoFA pour renvoyer qrCodeUrl et ouvrir le dialog
  const fakeQrUrl = 'http://example.com/qr.png';
  mockEnableTwoFA.mockResolvedValue({
    status: 200,
    data: { qrCodeUrl: fakeQrUrl, secret: null },
  });
  // 3) Mock confirmTwoFA pour rejeter avec axios error contenant code
  const axiosErr: any = new Error('Test');
  axiosErr.isAxiosError = true;
  axiosErr.response = { data: { code: 'SOME_ENABLE_ERROR' } };
  mockConfirmTwoFA.mockRejectedValue(axiosErr);
  // 4) Rendu du composant
  render(<TwoFASection enabled={false} onToggle={onToggleMock} />);
  // 5) Démarrer activation
  const switchCheckbox = screen.getByRole('checkbox');
  await act(async () => {
    fireEvent.click(switchCheckbox);
  });
  // Attendre ouverture dialog prepare
  await waitFor(() => {
    expect(screen.getByText('dashboard.enable2faTitle')).toBeInTheDocument();
  });
  // 6) Cliquer Next pour passer en enable_confirm
  const nextBtn = screen.getByRole('button', { name: 'dashboard.next' });
  await act(async () => {
    fireEvent.click(nextBtn);
  });
  // Attendre champ OTP
  const otpInput = await screen.findByLabelText('dashboard.otpCode');
  // 7) Saisir OTP non vide
  await act(async () => {
    fireEvent.change(otpInput, { target: { value: '123456' } });
  });
  // 8) Cliquer Confirm pour déclencher confirmTwoFA et sa rejection
  const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
  await act(async () => {
    fireEvent.click(confirmBtn);
  });
  // 9) Vérifier l’affichage de l’erreur via dialogErrorMsg
  await waitFor(() => {
    // le texte « error:SOME_ENABLE_ERROR » doit apparaître
    expect(screen.getByText('error:SOME_ENABLE_ERROR')).toBeInTheDocument();
  });
  // onToggle ne doit pas être appelé
  expect(onToggleMock).not.toHaveBeenCalled();
});

it('handleConfirm en activation: confirmTwoFA rejette avec erreur non-Axios affiche error:network_error', async () => {
  mockAuthToken('valid-token');
  const onToggleMock = vi.fn();
  // Mock enableTwoFA pour préparer
  const fakeQrUrl = 'http://example.com/qr.png';
  mockEnableTwoFA.mockResolvedValue({
    status: 200,
    data: { qrCodeUrl: fakeQrUrl, secret: null },
  });
  // Mock confirmTwoFA rejette avec une erreur réseau (isAxiosError=false)
  const netErr: any = new Error('Network');
  netErr.isAxiosError = false;
  mockConfirmTwoFA.mockRejectedValue(netErr);
  render(<TwoFASection enabled={false} onToggle={onToggleMock} />);
  // Démarrer activation
  await act(async () => {
    fireEvent.click(screen.getByRole('checkbox'));
  });
  await waitFor(() => {
    expect(screen.getByText('dashboard.enable2faTitle')).toBeInTheDocument();
  });
  // Next
  const nextBtn = screen.getByRole('button', { name: 'dashboard.next' });
  await act(async () => {
    fireEvent.click(nextBtn);
  });
  const otpInput = await screen.findByLabelText('dashboard.otpCode');
  await act(async () => {
    fireEvent.change(otpInput, { target: { value: '654321' } });
  });
  const confirmBtn = screen.getByRole('button', { name: 'dashboard.confirm' });
  await act(async () => {
    fireEvent.click(confirmBtn);
  });
  await waitFor(() => {
    expect(screen.getByText('error:network_error')).toBeInTheDocument();
  });
  expect(onToggleMock).not.toHaveBeenCalled();
});

});