import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// ——— Mock modules ———
vi.mock('../../utils/exportData', () => ({
  __esModule: true,
  exportData: vi.fn(),
}));

vi.mock('../../utils/logger', () => ({
  __esModule: true,
  logError: vi.fn(),
}));

vi.mock('../../hooks/useCustomSnackbar', () => {
  const notify = vi.fn();
  return {
    __esModule: true,
    useCustomSnackbar: () => ({ notify }),
  };
});

// On transforme ces hooks en espions pour pouvoir inspecter les appels
vi.mock('../../stores/useAuthStore', () => ({
  __esModule: true,
  useAuthStore: vi.fn(() => 'token-123'),
}));

vi.mock('../../stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: vi.fn(() => 'en'),
}));

vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('axios');

// ——— Mock MUI components ———
vi.mock('@mui/material/Card',        () => ({ __esModule: true, default: (p: any) => <div {...p}/> }));
vi.mock('@mui/material/CardContent', () => ({ __esModule: true, default: (p: any) => <div {...p}/> }));
vi.mock('@mui/material/CardActions', () => ({ __esModule: true, default: (p: any) => <div {...p}/> }));
vi.mock('@mui/material/Typography',  () => ({ __esModule: true, default: (p: any) => <p {...p}/> }));
vi.mock('@mui/material/CircularProgress', () => ({ __esModule: true, default: () => <span data-testid="spinner"/> }));
vi.mock('@mui/icons-material/Download',   () => ({ __esModule: true, default: () => <span data-testid="download-icon"/> }));
vi.mock('@mui/material/Button', () => ({
  __esModule: true,
  default: ({ children, startIcon, disabled, onClick }: any) => (
    <button disabled={disabled} onClick={onClick}>
      {startIcon}
      {children}
    </button>
  )
}));

// ——— Imports sous test ———
import { AdminReportDownloadCard } from './AdminReportDownloadCard';
import { exportData } from '../../utils/exportData';
import { logError } from '../../utils/logger';
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar';
import { useAuthStore } from '../../stores/useAuthStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import type { AdminReportsResponse } from '../../types/admin';

describe('AdminReportDownloadCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const { notify: mockNotify } = useCustomSnackbar();
  const mockData: AdminReportsResponse = {
    data: [{ product_id: 1, product_name: 'Test', sales_count: 5 }],
  };

  it('calls auth and language selectors correctly', () => {
    render(<AdminReportDownloadCard />);
    // Vérifie que nos hooks ont été appelés avec une fonction sélectrice
    expect(useAuthStore).toHaveBeenCalledWith(expect.any(Function));
    expect(useLanguageStore).toHaveBeenCalledWith(expect.any(Function));

    // Récupère les fonctions passées pour s'assurer qu'elles renvoient bien la bonne propriété
    const authSelector = (useAuthStore as any).mock.calls[0][0];
    const langSelector = (useLanguageStore as any).mock.calls[0][0];
    expect(authSelector({ authToken: 'foo' })).toBe('foo');
    expect(langSelector({ lang: 'fr' })).toBe('fr');
  });

  it('renders title, description and buttons', () => {
    render(<AdminReportDownloadCard filename="f" />);
    expect(screen.getByText('reports.download_title')).toBeInTheDocument();
    expect(screen.getByText('reports.download_description')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('exports CSV and notifies on success', async () => {
    (axios.get as any).mockResolvedValue({ data: mockData });
    render(<AdminReportDownloadCard filename="f" />);
    fireEvent.click(screen.getByText('CSV'));

    await waitFor(() => {
      expect(exportData).toHaveBeenCalledWith(
        mockData.data,
        'f',
        'csv',
        'export.sheetname',
        expect.any(Object)
      );
      expect(mockNotify).toHaveBeenCalledWith('reports.success', 'success');
    });
  });

  it('exports Excel and notifies on success', async () => {
    (axios.get as any).mockResolvedValue({ data: mockData });
    render(<AdminReportDownloadCard />);
    fireEvent.click(screen.getByText('Excel'));

    await waitFor(() => {
      expect(exportData).toHaveBeenCalledWith(
        mockData.data,
        'sales_report',
        'xlsx',
        'export.sheetname',
        expect.any(Object)
      );
      expect(mockNotify).toHaveBeenCalledWith('reports.success', 'success');
    });
  });

  it('logs error and notifies on failure', async () => {
    const error = new Error('err');
    (axios.get as any).mockRejectedValue(error);
    render(<AdminReportDownloadCard />);
    fireEvent.click(screen.getByText('CSV'));

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith('DownloadAdminReport', error);
      expect(mockNotify).toHaveBeenCalledWith('errors.download', 'error');
    });
  });

  it('shows loading spinners and disables buttons while fetching', async () => {
    let resolve!: (val?: any) => void;
    (axios.get as any).mockReturnValue(new Promise(r => { resolve = r; }));
    render(<AdminReportDownloadCard />);
    const btnCsv = screen.getByText('CSV');
    const btnXlsx = screen.getByText('Excel');

    fireEvent.click(btnCsv);
    expect(btnCsv).toBeDisabled();
    expect(btnXlsx).toBeDisabled();
    expect(screen.getAllByTestId('spinner')).toHaveLength(2);

    // Termine la promesse
    resolve({ data: mockData });
    await waitFor(() => expect(btnCsv).not.toBeDisabled());
  });
});
