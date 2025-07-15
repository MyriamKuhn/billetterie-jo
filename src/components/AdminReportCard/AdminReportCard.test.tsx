import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ----------------------------------------------------------------------------
// Mocks for MUI components: simplify rendering by using plain <div> and <p>
// ----------------------------------------------------------------------------
vi.mock('@mui/material/Card', () => ({ default: ({ children }: any) => <div data-testid="card">{children}</div> }));
vi.mock('@mui/material/CardContent', () => ({ default: ({ children }: any) => <div data-testid="card-content">{children}</div> }));
vi.mock('@mui/material/Typography', () => ({ default: ({ children, ...props }: any) => <p {...props}>{children}</p> }));

// ----------------------------------------------------------------------------
// Mock i18n translation function
// - For key 'reports.sales_count', return a formatted string including the count
// - Fallback to returning the key itself for other translation calls
// ----------------------------------------------------------------------------
const mockT = vi.fn((key, options) => {
  if (key === 'reports.sales_count') {
    return `Number of sales made: ${options.count}`;
  }
  return key;
});
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));

import { AdminReportCard } from './AdminReportCard';
import type { ReportProductSales } from '../../types/admin';

describe('AdminReportCard', () => {
  // Sample report data used in all tests
  const report: ReportProductSales = {
    product_id: 42,
    product_name: 'VIP Ticket',
    sales_count: 128,
  };

  // Reset mock call counts before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the product id and name correctly', () => {
    // Render the component with our sample report
    render(<AdminReportCard report={report} />);
    // Expect the title "#42 - VIP Ticket" to appear
    expect(screen.getByText('#42 - VIP Ticket')).toBeInTheDocument();
  });

  it('calls translation for sales_count and displays it', () => {
    // Render again to trigger the translation call
    render(<AdminReportCard report={report} />);
    // Verify the translation function was called with correct key and count parameter
    expect(mockT).toHaveBeenCalledWith('reports.sales_count', { count: 128 });
    // Verify the translated text is displayed
    expect(screen.getByText('Number of sales made: 128')).toBeInTheDocument();
  });
});
