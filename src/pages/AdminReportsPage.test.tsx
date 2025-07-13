import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// ─── Internationalisation ───────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ─── Stores : exécute les sélecteurs useAuthStore & useLanguageStore ───────────
vi.mock('../stores/useAuthStore', () => ({
  __esModule: true,
  useAuthStore: vi.fn((selector: any) => selector({ authToken: 'token-abc' })),
}));
vi.mock('../stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: vi.fn((selector: any) => selector({ lang: 'en' })),
}));
import { useAuthStore } from '../stores/useAuthStore';
import { useLanguageStore } from '../stores/useLanguageStore';

// ─── Hook à mocker ─────────────────────────────────────────────────────────────
vi.mock('../hooks/useAdminReports', () => {
  const fn = vi.fn();
  return { __esModule: true, useAdminReports: fn };
});
import { useAdminReports } from '../hooks/useAdminReports';
const mockUseAdmin = useAdminReports as unknown as Mock;

// ─── Composants enfants ─────────────────────────────────────────────────────────
vi.mock('../components/Seo', () => ({
  __esModule: true,
  default: ({ title, description }: any) => (
    <div data-testid="Seo">{title}|{description}</div>
  ),
}));
vi.mock('../components/PageWrapper', () => ({
  __esModule: true,
  PageWrapper: ({ children }: any) => (
    <div data-testid="PageWrapper">{children}</div>
  ),
}));
vi.mock('../components/ErrorDisplay', () => ({
  __esModule: true,
  ErrorDisplay: ({
    retryButtonText,
    homeButtonText,
    onRetry,
    showRetry,
    showHome,
  }: any) => (
    <div data-testid="ErrorDisplay">
      {showRetry && (
        <button data-testid="RetryButton" onClick={onRetry}>
          {retryButtonText}
        </button>
      )}
      {showHome && (
        <button data-testid="HomeButton">{homeButtonText}</button>
      )}
    </div>
  ),
}));
vi.mock('../components/OlympicLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="OlympicLoader" />,
}));
vi.mock('../components/AdminReportsFilter', () => ({
  __esModule: true,
  AdminReportsFilter: ({ filters, onChange }: any) => (
    <div data-testid="AdminReportsFilter">
      <span data-testid="FilterProps">
        {filters.per_page}-{filters.page}-{filters.sort_by}-{filters.sort_order}
      </span>
      <button
        data-testid="FilterOnChange"
        onClick={() => onChange({ page: 2 })}
      >
        ChangeFilter
      </button>
    </div>
  ),
}));
vi.mock('../components/AdminReportsGrid', () => ({
  __esModule: true,
  AdminReportsGrid: ({ reports }: any) => (
    <div data-testid="AdminReportsGrid">
      {reports.map((r: any) => r.product_name).join(',')}
    </div>
  ),
}));

// ─── MUI ────────────────────────────────────────────────────────────────────────
vi.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="Box">{children}</div>,
}));
vi.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <h4 data-testid="Typography">{children}</h4>
  ),
}));
vi.mock('@mui/material/Pagination', () => ({
  __esModule: true,
  default: ({ count, page, onChange }: any) => (
    <button
      data-testid="Pagination"
      data-count={count}
      data-page={page}
      onClick={() => onChange(null, page + 1)}
    >
      {page}/{count}
    </button>
  ),
}));

// ─── La page sous test ─────────────────────────────────────────────────────────
import AdminReportsPage from './AdminReportsPage';

describe('AdminReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes the selectors passed to useAuthStore and useLanguageStore', () => {
    mockUseAdmin.mockReturnValue({
      reports: [],
      total: 0,
      loading: true,
      error: null,
      validationErrors: null,
    });

    render(<AdminReportsPage />);
    expect(useAuthStore).toHaveBeenCalled();
    expect(useLanguageStore).toHaveBeenCalled();
  });

  it('covers onRetry={() => setFilters(f => ({ ...f }))}', async () => {
    mockUseAdmin.mockReturnValue({
      reports: [],
      total: 0,
      loading: false,
      error: 'ERR',
      validationErrors: null,
    });

    render(<AdminReportsPage />);
    const callsBefore = mockUseAdmin.mock.calls.length;

    fireEvent.click(screen.getByTestId('RetryButton'));
    await waitFor(() =>
      expect(mockUseAdmin.mock.calls.length).toBe(callsBefore + 1)
    );
  });

  it('shows loader and filter sidebar when loading', () => {
    mockUseAdmin.mockReturnValue({
      reports: [],
      total: 0,
      loading: true,
      error: null,
      validationErrors: null,
    });

    render(<AdminReportsPage />);
    expect(screen.getByTestId('OlympicLoader')).toBeInTheDocument();
    expect(screen.getByTestId('AdminReportsFilter')).toBeInTheDocument();
  });

  it('covers onChange via filter and pagination page change', async () => {
    const sample = [{ product_id: 1, product_name: 'Prod', sales_count: 2 }];
    mockUseAdmin.mockReturnValue({
      reports: sample,
      total: 15,
      loading: false,
      error: null,
      validationErrors: null,
    });

    render(<AdminReportsPage />);

    expect(screen.getByTestId('FilterProps')).toHaveTextContent(
      '10-1-sales_count-desc'
    );
    expect(screen.getByTestId('Pagination')).toHaveAttribute('data-page', '1');

    fireEvent.click(screen.getByTestId('FilterOnChange'));
    await waitFor(() =>
      expect(screen.getByTestId('FilterProps')).toHaveTextContent(
        '10-2-sales_count-desc'
      )
    );

    fireEvent.click(screen.getByTestId('Pagination'));
    await waitFor(() => {
      expect(screen.getByTestId('Pagination')).toHaveAttribute(
        'data-page',
        '3'
      );
      expect(screen.getByTestId('FilterProps')).toHaveTextContent(
        '10-3-sales_count-desc'
      );
    });
  });

  it('resets filters when validationErrors appear (covering all cleanup branches)', async () => {
    mockUseAdmin.mockReturnValue({
      reports: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: {
        sort_by: ['err'],
        sort_order: ['err'],
        per_page: ['err'],
        page: ['err'],
      },
    });

    render(<AdminReportsPage />);
    await waitFor(() =>
      expect(screen.getByTestId('FilterProps')).toHaveTextContent(
        '5-1-sales_count-desc'
      )
    );
  });

  it('covers else-path when validationErrors is empty object', async () => {
    mockUseAdmin.mockReturnValue({
      reports: [],
      total: 0,
      loading: false,
      error: null,
      validationErrors: {},
    });

    render(<AdminReportsPage />);
    await waitFor(() =>
      expect(screen.getByTestId('FilterProps')).toHaveTextContent(
        '10-1-sales_count-desc'
      )
    );
  });

  it('uses count=1 fallback when total/per_page is zero', () => {
    const sample = [{ product_id: 1, product_name: 'X', sales_count: 1 }];
    mockUseAdmin.mockReturnValue({
      reports: sample,
      total: 0,
      loading: false,
      error: null,
      validationErrors: null,
    });

    render(<AdminReportsPage />);
    expect(screen.getByTestId('Pagination')).toHaveAttribute(
      'data-count',
      '1'
    );
  });
});
