import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock MUI components to simplify rendering
vi.mock('@mui/material/Card', () => ({ default: ({ children }: any) => <div data-testid="card">{children}</div> }));
vi.mock('@mui/material/CardContent', () => ({ default: ({ children }: any) => <div data-testid="card-content">{children}</div> }));
vi.mock('@mui/material/Typography', () => ({ default: ({ children, ...props }: any) => <p {...props}>{children}</p> }));

// Mock useTranslation
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
  const report: ReportProductSales = {
    product_id: 42,
    product_name: 'VIP Ticket',
    sales_count: 128,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the product id and name correctly', () => {
    render(<AdminReportCard report={report} />);
    expect(screen.getByText('#42 - VIP Ticket')).toBeInTheDocument();
  });

  it('calls translation for sales_count and displays it', () => {
    render(<AdminReportCard report={report} />);
    expect(mockT).toHaveBeenCalledWith('reports.sales_count', { count: 128 });
    expect(screen.getByText('Number of sales made: 128')).toBeInTheDocument();
  });
});
