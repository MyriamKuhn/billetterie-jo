import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// ——— Mock modules ———
// Mock exportData utility to track calls without performing real exports
vi.mock('../../utils/exportData', () => ({
  __esModule: true,
  exportData: vi.fn(),
}));
// Mock logger to spy on error logging
vi.mock('../../utils/logger', () => ({
  __esModule: true,
  logError: vi.fn(),
}));
// Mock custom snackbar hook to capture notifications
vi.mock('../../hooks/useCustomSnackbar', () => {
  const notify = vi.fn();
  return {
    __esModule: true,
    useCustomSnackbar: () => ({ notify }),
  };
});

// Mock auth and language stores to return fixed values and let us inspect selectors
vi.mock('../../stores/useAuthStore', () => ({
  __esModule: true,
  useAuthStore: vi.fn(() => 'token-123'),
}));

vi.mock('../../stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: vi.fn(() => 'en'),
}));
// Mock translation hook to just echo keys
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key }),
}));
// Mock axios to control HTTP responses
vi.mock('axios');

// ——— Mock MUI components ———
// Replace MUI Card and related components with simple div/p wrappers
vi.mock('@mui/material/Card',        () => ({ __esModule: true, default: (p: any) => <div {...p}/> }));
vi.mock('@mui/material/CardContent', () => ({ __esModule: true, default: (p: any) => <div {...p}/> }));
vi.mock('@mui/material/CardActions', () => ({ __esModule: true, default: (p: any) => <div {...p}/> }));
vi.mock('@mui/material/Typography',  () => ({ __esModule: true, default: (p: any) => <p {...p}/> }));
// Mock spinner and download icon for loading state
vi.mock('@mui/material/CircularProgress', () => ({ __esModule: true, default: () => <span data-testid="spinner"/> }));
vi.mock('@mui/icons-material/Download',   () => ({ __esModule: true, default: () => <span data-testid="download-icon"/> }));
// Mock Button to a plain <button> that respects disabled and onClick
vi.mock('@mui/material/Button', () => ({
  __esModule: true,
  default: ({ children, startIcon, disabled, onClick }: any) => (
    <button disabled={disabled} onClick={onClick}>
      {startIcon}
      {children}
    </button>
  )
}));

// ——— Imports under test ———
import { AdminReportDownloadCard } from './AdminReportDownloadCard';
import { exportData } from '../../utils/exportData';
import { logError } from '../../utils/logger';
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar';
import { useAuthStore } from '../../stores/useAuthStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import type { AdminReportsResponse } from '../../types/admin';

describe('AdminReportDownloadCard', () => {
  beforeEach(() => {
    // Reset all mock implementations and counters before each test
    vi.clearAllMocks();
  });

  // Grab the notify spy from the mocked snackbar hook
  const { notify: mockNotify } = useCustomSnackbar();
  // Sample API response structure
  const mockData: AdminReportsResponse = {
    data: [{ product_id: 1, product_name: 'Test', sales_count: 5 }],
  };

  it('calls auth and language selectors correctly', () => {
    render(<AdminReportDownloadCard />);
    // Ensure the store hooks were called with selector functions
    expect(useAuthStore).toHaveBeenCalledWith(expect.any(Function));
    expect(useLanguageStore).toHaveBeenCalledWith(expect.any(Function));

    // Extract and test the selector functions directly
    const authSelector = (useAuthStore as any).mock.calls[0][0];
    const langSelector = (useLanguageStore as any).mock.calls[0][0];
    expect(authSelector({ authToken: 'foo' })).toBe('foo');
    expect(langSelector({ lang: 'fr' })).toBe('fr');
  });

  it('renders title, description and buttons', () => {
    render(<AdminReportDownloadCard filename="f" />);
    // Check that translation keys for title and description appear
    expect(screen.getByText('reports.download_title')).toBeInTheDocument();
    expect(screen.getByText('reports.download_description')).toBeInTheDocument();
    // Should render two buttons: CSV and Excel
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('exports CSV and notifies on success', async () => {
    // Mock axios to return our sample data
    (axios.get as any).mockResolvedValue({ data: mockData });
    render(<AdminReportDownloadCard filename="f" />);
    // Click the "CSV" button
    fireEvent.click(screen.getByText('CSV'));

    await waitFor(() => {
      // Verify exportData called with correct arguments
      expect(exportData).toHaveBeenCalledWith(
        mockData.data,
        'f',  // filename prop
        'csv',
        'export.sheetname',
        expect.any(Object)
      );
      // Verify success notification
      expect(mockNotify).toHaveBeenCalledWith('reports.success', 'success');
    });
  });

  it('exports Excel and notifies on success', async () => {
    (axios.get as any).mockResolvedValue({ data: mockData });
    render(<AdminReportDownloadCard />);
    // Click the "Excel" button
    fireEvent.click(screen.getByText('Excel'));

    await waitFor(() => {
      expect(exportData).toHaveBeenCalledWith(
        mockData.data,
        'sales_report',   // default filename when none provided
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
      // Should log the error with the correct context
      expect(logError).toHaveBeenCalledWith('DownloadAdminReport', error);
      // Should notify user of download failure
      expect(mockNotify).toHaveBeenCalledWith('errors.download', 'error');
    });
  });

  it('shows loading spinners and disables buttons while fetching', async () => {
    let resolve!: (val?: any) => void;
    // Mock axios.get to a pending promise we control
    (axios.get as any).mockReturnValue(new Promise(r => { resolve = r; }));
    render(<AdminReportDownloadCard />);
    const btnCsv = screen.getByText('CSV');
    const btnXlsx = screen.getByText('Excel');

    // Trigger download
    fireEvent.click(btnCsv);
    // Buttons should be disabled during fetch
    expect(btnCsv).toBeDisabled();
    expect(btnXlsx).toBeDisabled();
    // Both spinners should appear
    expect(screen.getAllByTestId('spinner')).toHaveLength(2);

    // Resolve the fetch to end loading
    resolve({ data: mockData });
    await waitFor(() => expect(btnCsv).not.toBeDisabled());
  });
});
