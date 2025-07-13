import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────────────────
// Mock dayjs to return a fixed date
vi.mock('dayjs', () => ({
  __esModule: true,
  default: () => ({
    format: () => '2025-07-13',
  }),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock MUI components
vi.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="Box">{children}</div>,
}));
vi.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children }: any) => <h4 data-testid="Typography">{children}</h4>,
}));

// Mock child components
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
    vi.clearAllMocks();
  });

  it('affiche un message quand il n’y a pas de rapports', () => {
    render(<AdminReportsGrid reports={[]} />);
    // Vérifie que le message d'erreur est affiché
    expect(screen.getByTestId('Typography')).toHaveTextContent('errors.no_reports');
    // Les composants Download et Card ne doivent pas apparaître
    expect(screen.queryByTestId('AdminReportDownloadCard')).toBeNull();
    expect(screen.queryByTestId('AdminReportCard')).toBeNull();
  });

  it('rend le DownloadCard et autant de AdminReportCard que de rapports', () => {
    const reports: ReportProductSales[] = [
      { product_id: 1, product_name: 'Produit A', sales_count: 10 },
      { product_id: 2, product_name: 'Produit B', sales_count: 5 },
    ];

    render(<AdminReportsGrid reports={reports} />);

    // Le container Box
    const container = screen.getByTestId('Box');
    expect(container).toBeInTheDocument();

    // Le DownloadCard reçoit le filename interpolé
    const download = screen.getByTestId('AdminReportDownloadCard');
    expect(download).toHaveTextContent('export.filename'); // t('export.filename')

    // Deux AdminReportCard, un pour chaque report
    const cards = screen.getAllByTestId('AdminReportCard');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('Produit A');
    expect(cards[1]).toHaveTextContent('Produit B');
  });
});
