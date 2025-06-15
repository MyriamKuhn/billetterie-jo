import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TwoFASection } from '../../components/TwoFASection/TwoFASection'; // Ajustez le chemin selon votre projet
import { enableTwoFA, disableTwoFA } from '../../services/userService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

// Mock de useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
// Mock des services userService
vi.mock('../../services/userService', () => ({
  enableTwoFA: vi.fn(),
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
// Mock getErrorMessage
vi.mock('../../utils/errorUtils', () => ({
  getErrorMessage: (_t: any, code: string) => `error:${code}`,
}));

describe('TwoFASection', () => {
  type AuthSelector = (state: { authToken: string | null }) => string | null;

  // Cast avec le type Mock importé depuis vitest
  const mockEnableTwoFA = enableTwoFA as unknown as Mock;
  const mockDisableTwoFA = disableTwoFA as unknown as Mock;
  const mockUseAuthStore = useAuthStore as unknown as Mock;
  const mockUseNavigate = useNavigate as unknown as Mock;

  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup(); // s'assure que tout rendu précédent est démonté
    // mock navigate
    navigateMock = vi.fn();
    mockUseNavigate.mockReturnValue(navigateMock);
  });

  function mockAuthToken(token: string | null) {
    mockUseAuthStore.mockImplementation((selector: AuthSelector) => selector({ authToken: token }));
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

  it('enables 2FA successfully: calls enableTwoFA, shows dialog, onToggle(true), then closes on confirm', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const fakeQrUrl = 'http://example.com/qr.png';
    const fakeSecret = 'SECRET123';
    mockEnableTwoFA.mockResolvedValue({
      status: 200,
      data: { qrCodeUrl: fakeQrUrl, secret: fakeSecret },
    });

    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });

    await waitFor(() => {
      expect(mockEnableTwoFA).toHaveBeenCalledWith('valid-token');
    });
    expect(onToggleMock).toHaveBeenCalledWith(true);
    expect(screen.getByText('success.2faEnabled')).toBeInTheDocument();
    expect(screen.getByText('dialog.enable2faTitle')).toBeInTheDocument();
    expect(screen.getByText('dialog.scanQRCodeWithoutConfirm')).toBeInTheDocument();
    const img = screen.getByRole('img', { name: /QR Code/i });
    expect(img).toHaveAttribute('src', fakeQrUrl);
    expect(screen.getByText(new RegExp(`dialog.secret: ${fakeSecret}`))).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: 'buttons.confirm' });
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    await waitFor(() => {
      expect(screen.queryByText('dialog.enable2faTitle')).toBeNull();
    });
  });

  it('handles enableTwoFA failure status 200 without qrCodeUrl: shows generic error and does not call onToggle', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    mockEnableTwoFA.mockResolvedValue({ status: 200, data: {} });

    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });

    await waitFor(() => {
      expect(screen.getByText('errors.generic_error')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('handles enableTwoFA axios error with code: shows specific error', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const axiosErr: any = new Error('Test');
    axiosErr.isAxiosError = true;
    axiosErr.response = { data: { code: 'SOME_CODE' } };
    mockEnableTwoFA.mockRejectedValue(axiosErr);

    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });

    await waitFor(() => {
      expect(screen.getByText('error:SOME_CODE')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('handles enableTwoFA network error: shows network error message', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
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

  it('disables 2FA successfully: opens dialog, requires OTP input, calls disableTwoFA, onToggle(false), shows success, closes dialog', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    mockDisableTwoFA.mockResolvedValue({ status: 204 });

    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });

    expect(screen.getByText('dialog.disable2faTitle')).toBeInTheDocument();
    const otpInput = screen.getByLabelText('fields.otpCode');
    expect(otpInput).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: 'buttons.confirm' });
    expect(confirmBtn).toBeDisabled();

    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '123456' } });
    });
    expect(screen.getByRole('button', { name: 'buttons.confirm' })).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    await waitFor(() => {
      expect(mockDisableTwoFA).toHaveBeenCalledWith('valid-token', '123456');
    });
    expect(onToggleMock).toHaveBeenCalledWith(false);
    expect(screen.getByText('success.2faDisabled')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('dialog.disable2faTitle')).toBeNull();
    });
  });

  it('handles disableTwoFA failure status !=204: shows generic error and does not call onToggle again', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    mockDisableTwoFA.mockResolvedValue({ status: 400 });

    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });

    const otpInput = screen.getByLabelText('fields.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '654321' } });
    });
    const confirmBtn = screen.getByRole('button', { name: 'buttons.confirm' });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    await waitFor(() => {
      expect(screen.getByText('errors.generic_error')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('handles disableTwoFA axios error with code: shows specific error', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const axiosErr: any = new Error('Test');
    axiosErr.isAxiosError = true;
    axiosErr.response = { data: { code: 'SOME_DIS_CODE' } };
    mockDisableTwoFA.mockRejectedValue(axiosErr);

    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });

    const otpInput = screen.getByLabelText('fields.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '000000' } });
    });
    const confirmBtn = screen.getByRole('button', { name: 'buttons.confirm' });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    await waitFor(() => {
      expect(screen.getByText('error:SOME_DIS_CODE')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('handles disableTwoFA network error: shows network error message', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const netErr: any = new Error('Network');
    netErr.isAxiosError = false;
    mockDisableTwoFA.mockRejectedValue(netErr);

    render(<TwoFASection enabled={true} onToggle={onToggleMock} />);

    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });

    const otpInput = screen.getByLabelText('fields.otpCode');
    await act(async () => {
      fireEvent.change(otpInput, { target: { value: '111111' } });
    });
    const confirmBtn = screen.getByRole('button', { name: 'buttons.confirm' });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    await waitFor(() => {
      expect(screen.getByText('error:network_error')).toBeInTheDocument();
    });
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('cancels dialog on cancel click (enable scenario)', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const fakeQrUrl = 'http://example.com/qr2.png';
    const fakeSecret = 'SECRET456';
    mockEnableTwoFA.mockResolvedValue({
      status: 200,
      data: { qrCodeUrl: fakeQrUrl, secret: fakeSecret },
    });

    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });
    expect(screen.getByText('dialog.enable2faTitle')).toBeInTheDocument();
    const cancelBtn = screen.getByRole('button', { name: 'buttons.cancel' });
    await act(async () => {
      fireEvent.click(cancelBtn);
    });
    await waitFor(() => {
      expect(screen.queryByText('dialog.enable2faTitle')).toBeNull();
    });
  });

  it('accordion toggles expanded state (checks existence in DOM)', async () => {
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    expect(screen.getByText('info.2faDisabled')).toBeInTheDocument();

    const summary = screen.getByText('sections.twoFA');
    await act(async () => {
      fireEvent.click(summary);
    });
    expect(screen.getByText('info.2faDisabled')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(summary);
    });
    expect(screen.getByText('info.2faDisabled')).toBeInTheDocument();
  });

  it('handle dialog close resets dialog state (avec nettoyage entre deux render)', async () => {
    // Premier rendu : enable scenario
    mockAuthToken('valid-token');
    const onToggleMock = vi.fn();
    const fakeQrUrl = 'http://example.com/qr3.png';
    mockEnableTwoFA.mockResolvedValue({
      status: 200,
      data: { qrCodeUrl: fakeQrUrl, secret: null },
    });

    const { unmount } = render(<TwoFASection enabled={false} onToggle={onToggleMock} />);

    // Cliquer pour activer 2FA => dialog enable
    const switchCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox);
    });
    expect(screen.getByText('dialog.enable2faTitle')).toBeInTheDocument();

    // Cliquer Cancel ferme le dialog
    const cancelBtn = screen.getByRole('button', { name: 'buttons.cancel' });
    await act(async () => {
      fireEvent.click(cancelBtn);
    });
    await waitFor(() => {
      expect(screen.queryByText('dialog.enable2faTitle')).toBeNull();
    });

    // On démonte cette instance avant de rerender
    unmount();

    // Deuxième rendu : disable scenario
    mockDisableTwoFA.mockResolvedValue({ status: 204 });
    onToggleMock.mockReset();

    const { unmount: unmount2 } = render(<TwoFASection enabled={true} onToggle={onToggleMock} />);
    const switchCheckbox2 = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(switchCheckbox2);
    });
    expect(screen.getByText('dialog.disable2faTitle')).toBeInTheDocument();

    const cancelBtn2 = screen.getByRole('button', { name: 'buttons.cancel' });
    await act(async () => {
      fireEvent.click(cancelBtn2);
    });
    await waitFor(() => {
      expect(screen.queryByText('dialog.disable2faTitle')).toBeNull();
    });

    unmount2();
  });
});
