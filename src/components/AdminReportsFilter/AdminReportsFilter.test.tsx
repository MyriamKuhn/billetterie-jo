import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock des dépendances MUI et des icônes
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
// ======== On change le mock de Drawer pour utiliser onClose via un click ========
vi.mock('@mui/material/Drawer', () => ({
  __esModule: true,
  default: ({ open, children, onClose, ...props }: any) => (
    open
      // quand open=true on rend un div clickable qui déclenche onClose
      ? <div data-testid="Drawer-open" onClick={onClose} {...props}>{children}</div>
      : <div data-testid="Drawer-closed" {...props}/>
  ),
}));
// ===========================================================================

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

// Mock des composants enfants
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

// Mock i18n
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Import sous test
import { AdminReportsFilter } from './AdminReportsFilter';
import type { AdminReportsFilters } from '../../types/admin';

describe('AdminReportsFilter', () => {
  let filters: AdminReportsFilters;
  let onChange: Mock;

  beforeEach(() => {
    filters = {
      sort_by: 'sales_count',
      sort_order: 'desc',
      per_page: 10,
      page: 2,
    };
    onChange = vi.fn();
  });

  it('affiche le contenu desktop et mobile sans drawer ouvert', () => {
    render(<AdminReportsFilter filters={filters} onChange={onChange} />);

    expect(screen.getByText('filters.title')).toBeInTheDocument();
    expect(screen.getByTestId('SortControl')).toBeInTheDocument();
    expect(screen.getByTestId('FilterSelect')).toBeInTheDocument();
    expect(screen.getByText('filters.reset')).toBeInTheDocument();

    expect(screen.getByTestId('MenuIcon')).toBeInTheDocument();
    expect(screen.getByTestId('Drawer-closed')).toBeInTheDocument();
  });

  it('ouvre et ferme le drawer en mobile (via onClose en click)', async () => {
    render(<AdminReportsFilter filters={filters} onChange={onChange} />);

    // Ouvre le drawer
    fireEvent.click(screen.getByTestId('IconButton'));
    await waitFor(() => {
      expect(screen.getByTestId('Drawer-open')).toBeInTheDocument();
    });

    // Ferme via le click qui appelle onClose
    fireEvent.click(screen.getByTestId('Drawer-open'));
    await waitFor(() => {
      expect(screen.getByTestId('Drawer-closed')).toBeInTheDocument();
    });

    // Rouvre, puis ferme via le bouton CloseIcon
    fireEvent.click(screen.getByTestId('IconButton'));
    await waitFor(() => {
      expect(screen.getByTestId('Drawer-open')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('CloseIcon'));
    await waitFor(() => {
      expect(screen.getByTestId('Drawer-closed')).toBeInTheDocument();
    });
  });

  it('déclenche onChange quand on change le tri via SortControl', () => {
    render(<AdminReportsFilter filters={filters} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('SortButton'));
    expect(onChange).toHaveBeenCalledWith({
      sort_by: 'sales_count',
      sort_order: 'asc',
      page: 1,
    });
  });

  it('déclenche onChange quand on change le nombre par page via FilterSelect', () => {
    render(<AdminReportsFilter filters={filters} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('FilterSelect'), {
      target: { value: '25' },
    });
    expect(onChange).toHaveBeenCalledWith({
      per_page: 25,
      page: 1,
    });
  });

  it('réinitialise les filtres quand on clique sur Reset', () => {
    render(<AdminReportsFilter filters={filters} onChange={onChange} />);
    fireEvent.click(screen.getByText('filters.reset'));
    expect(onChange).toHaveBeenCalledWith({
      sort_by: 'sales_count',
      sort_order: 'desc',
      per_page: 5,
      page: 1,
    });
  });
});
