import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────────────────
// Mock dayjs to always format to a fixed date for consistent snapshot/testing
vi.mock('dayjs', () => ({
  __esModule: true,
  default: () => ({
    format: () => '2025-07-13',
  }),
}));

// Mock react-i18next so translation function returns the key unchanged
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock MUI components to simplify rendering and add data-testid attributes
vi.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="Box">{children}</div>,
}));
vi.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children }: any) => <h4 data-testid="Typography">{children}</h4>,
}));

// Mock child components so we can verify integration points
vi.mock('../AdminReportDownloadCard', () => ({
  __esModule: true,
  AdminReportDownloadCard: ({ filename }: any) => (
    <div data-testid="AdminReportDownloadCard">{filename}</div>
  ),
}));
vi.mock('../AdminReportCard', () => ({
  __esModule: true,
  AdminReportCard: ({ report }: any) => (
    <div data-testid="AdminReportCard">{report.product_name}</div>
  ),
}));

// ─── Under test ────────────────────────────────────────────────────────────────
import { AdminReportsGrid } from './AdminReportsGrid';
import type { ReportProductSales } from '../../types/admin';

describe('AdminReportsGrid', () => {
  beforeEach(() => {
    // Reset all mocks before each test for isolation
    vi.clearAllMocks();
  });

  it('displays a message when no reports are provided', () => {
    // Render grid with empty array: should hit empty-state branch
    render(<AdminReportsGrid reports={[]} />);
    // Verify error message key is rendered
    expect(screen.getByTestId('Typography')).toHaveTextContent('errors.no_reports');
    // Download and card components should not appear when no data
    expect(screen.queryByTestId('AdminReportDownloadCard')).toBeNull();
    expect(screen.queryByTestId('AdminReportCard')).toBeNull();
  });

  it('renders the download card and a card per report entry', () => {
    // Sample data with two report entries
    const reports: ReportProductSales[] = [
      { product_id: 1, product_name: 'Produit A', sales_count: 10 },
      { product_id: 2, product_name: 'Produit B', sales_count: 5 },
    ];

    // Render grid with data
    render(<AdminReportsGrid reports={reports} />);

    // Container Box should render
    const container = screen.getByTestId('Box');
    expect(container).toBeInTheDocument();

    // Download card should receive interpolated filename key
    const download = screen.getByTestId('AdminReportDownloadCard');
    expect(download).toHaveTextContent('export.filename'); // verifies t('export.filename') was passed

    // One report card per entry
    const cards = screen.getAllByTestId('AdminReportCard');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('Produit A');
    expect(cards[1]).toHaveTextContent('Produit B');
  });
});
