import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// ——— Mock MUI components to simplify rendering and focus on logic ———
vi.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <div data-testid="Box" {...props}>{children}</div>
  ),
}));
vi.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <h6 data-testid="Typography" {...props}>{children}</h6>
  ),
}));
vi.mock('@mui/material/Stack', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <div data-testid="Stack" {...props}>{children}</div>
  ),
}));
vi.mock('@mui/material/Button', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <button data-testid="Button" {...props}>{children}</button>
  ),
}));
vi.mock('@mui/material/IconButton', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <button data-testid="IconButton" {...props}>{children}</button>
  ),
}));
// ——— Replace Drawer mock so that clicking the open drawer element calls onClose ———
vi.mock('@mui/material/Drawer', () => ({
  __esModule: true,
  default: ({ open, children, onClose, ...props }: any) => (
    open
      // When open=true, render a div that triggers onClose when clicked
      ? <div data-testid="Drawer-open" onClick={onClose} {...props}>{children}</div>
      // When closed, render a div indicating closed state
      : <div data-testid="Drawer-closed" {...props}/>
  ),
}));

// ——— Theme and Icon mocks ———
vi.mock('@mui/material/styles', () => ({
  useTheme: () => ({
    mixins: { toolbar: { minHeight: 64 } },
    palette: { divider: '#ccc' },
  }),
}));
vi.mock('@mui/icons-material/Menu', () => ({
  __esModule: true,
  default: () => <span data-testid="MenuIcon">≡</span>,
}));
vi.mock('@mui/icons-material/Close', () => ({
  __esModule: true,
  default: () => <span data-testid="CloseIcon">×</span>,
}));

// ——— Mock child filter/sort components to control their behavior ———
vi.mock('../FilterSelect', () => ({
  __esModule: true,
  FilterSelect: ({ label, value, options, onChange }: any) => (
    <select
      data-testid="FilterSelect"
      aria-label={label}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map((o: string) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  ),
}));
vi.mock('../SortControl', () => ({
  __esModule: true,
  SortControl: ({
    fields,
    order,
    onSortChange,
    label,
  }: any) => (
    <div data-testid="SortControl">
      <span>{label}</span>
      {/* Clicking toggles between desc/asc on the first field */}
      <button
        data-testid="SortButton"
        onClick={() => {
          const nextField = fields[0].value;
          const nextOrder = order === 'desc' ? 'asc' : 'desc';
          onSortChange(nextField, nextOrder);
        }}
      >
        toggle
      </button>
    </div>
  ),
}));

// ——— Mock translation to return keys directly ———
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// ——— Component under test ———
import { AdminReportsFilter } from './AdminReportsFilter';
import type { AdminReportsFilters } from '../../types/admin';

describe('AdminReportsFilter', () => {
  let filters: AdminReportsFilters;
  let onChange: Mock;

  beforeEach(() => {
    // Initialize filter state and spy before each test
    filters = {
      sort_by: 'sales_count',
      sort_order: 'desc',
      per_page: 10,
      page: 2,
    };
    onChange = vi.fn();
  });

  it('renders both desktop and mobile UI when drawer is closed', () => {
    render(<AdminReportsFilter filters={filters} onChange={onChange} />);
    // Check title, sort control, and per-page select are visible
    expect(screen.getByText('filters.title')).toBeInTheDocument();
    expect(screen.getByTestId('SortControl')).toBeInTheDocument();
    expect(screen.getByTestId('FilterSelect')).toBeInTheDocument();
    expect(screen.getByText('filters.reset')).toBeInTheDocument();

    // Menu icon and closed drawer indicator should appear
    expect(screen.getByTestId('MenuIcon')).toBeInTheDocument();
    expect(screen.getByTestId('Drawer-closed')).toBeInTheDocument();
  });

  it('opens and closes the mobile drawer via clicks', async () => {
    render(<AdminReportsFilter filters={filters} onChange={onChange} />);

    // Open drawer by clicking the icon button
    fireEvent.click(screen.getByTestId('IconButton'));
    await waitFor(() => {
      expect(screen.getByTestId('Drawer-open')).toBeInTheDocument();
    });

    // Close drawer by clicking on the open-drawer area (onClose)
    fireEvent.click(screen.getByTestId('Drawer-open'));
    await waitFor(() => {
      expect(screen.getByTestId('Drawer-closed')).toBeInTheDocument();
    });

    // Re-open then close via the CloseIcon button
    fireEvent.click(screen.getByTestId('IconButton'));
    await waitFor(() => {
      expect(screen.getByTestId('Drawer-open')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('CloseIcon'));
    await waitFor(() => {
      expect(screen.getByTestId('Drawer-closed')).toBeInTheDocument();
    });
  });

  it('triggers onChange when sorting is toggled', () => {
    render(<AdminReportsFilter filters={filters} onChange={onChange} />);
    // Simulate clicking the sort toggle button
    fireEvent.click(screen.getByTestId('SortButton'));
    // Expect onChange called with updated sort order and reset page
    expect(onChange).toHaveBeenCalledWith({
      sort_by: 'sales_count',
      sort_order: 'asc',
      page: 1,
    });
  });

  it('triggers onChange when per-page selection changes', () => {
    render(<AdminReportsFilter filters={filters} onChange={onChange} />);
    // Change the select to '25'
    fireEvent.change(screen.getByTestId('FilterSelect'), {
      target: { value: '25' },
    });
    // Expect onChange with new per_page and reset page
    expect(onChange).toHaveBeenCalledWith({
      per_page: 25,
      page: 1,
    });
  });

  it('resets all filters when clicking Reset', () => {
    render(<AdminReportsFilter filters={filters} onChange={onChange} />);
    // Click the reset button
    fireEvent.click(screen.getByText('filters.reset'));
    // Expect onChange with default per_page and reset page
    expect(onChange).toHaveBeenCalledWith({
      sort_by: 'sales_count',
      sort_order: 'desc',
      per_page: 5,
      page: 1,
    });
  });
});
