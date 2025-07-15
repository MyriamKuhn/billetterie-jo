import { render, screen, fireEvent, within } from '@testing-library/react';
import { UsersFilters, type UsersFiltersProps } from './UsersFilters';
import { vi } from 'vitest';

// mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// mock theme
vi.mock('@mui/material/styles', () => ({
  __esModule: true,
  useTheme: () => ({ mixins: { toolbar: { minHeight: 64 } }, palette: { divider: '#ccc' } }),
}));

// stub FilterField
vi.mock('../FilterField', () => ({
  FilterField: ({ label, value, onChange }: any) => (
    <div>
      <label>{label}</label>
      <input
        data-testid={`field-${label}`}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  ),
}));
// stub FilterSelect
vi.mock('../FilterSelect', () => ({
  FilterSelect: ({ label, value, onChange }: any) => (
    <div>
      <label>{label}</label>
      <select
        data-testid={`select-${label}`}
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
      >
        {[5,10,15,20,25,50,100].map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  ),
}));
// stub Drawer
vi.mock('@mui/material/Drawer', () => ({
  __esModule: true,
  default: ({ open, onClose, children }: any) => (
    <div data-testid={`drawer-${open}`} onClick={() => onClose()}>
      {children}
    </div>
  ),
}));

describe('UsersFilters', () => {
  const baseFilters = {
    firstname: 'A',
    lastname: 'B',
    email: 'c@ex.com',
    perPage: 15,
    page: 3,
  };
  let onChange: UsersFiltersProps['onChange'];

  beforeEach(() => {
    onChange = vi.fn();
  });

  it('renders all fields in desktop sidebar', () => {
    render(<UsersFilters role="user" filters={baseFilters} onChange={onChange} />);
    const sidebar = screen.getByRole('complementary');
    const utils = within(sidebar);

    expect(utils.getByText('filters.title')).toBeInTheDocument();
    expect(utils.getByTestId('field-filters.firstname')).toHaveValue('A');
    expect(utils.getByTestId('field-filters.lastname')).toHaveValue('B');
    expect(utils.getByTestId('field-filters.email')).toHaveValue('c@ex.com');
    expect(utils.getByTestId('select-filters.user_per_page')).toHaveValue('15');
    expect(utils.getByRole('button', { name: 'filters.reset' })).toBeInTheDocument();
  });

  it('calls onChange with firstname and page=1 when firstname changes', () => {
    render(<UsersFilters role="employee" filters={baseFilters} onChange={onChange} />);
    const input = screen.getAllByTestId('field-filters.firstname')[0];
    fireEvent.change(input, { target: { value: 'NewFirst' } });
    expect(onChange).toHaveBeenCalledWith({ firstname: 'NewFirst', page: 1 });
  });

  it('calls onChange with lastname and page=1 when lastname changes', () => {
    render(<UsersFilters role="employee" filters={baseFilters} onChange={onChange} />);
    const input = screen.getAllByTestId('field-filters.lastname')[0];
    fireEvent.change(input, { target: { value: 'NewLast' } });
    expect(onChange).toHaveBeenCalledWith({ lastname: 'NewLast', page: 1 });
  });

  it('calls onChange with email and page=1 when email changes', () => {
    render(<UsersFilters role="employee" filters={baseFilters} onChange={onChange} />);
    const input = screen.getAllByTestId('field-filters.email')[0];
    fireEvent.change(input, { target: { value: 'x@y.com' } });
    expect(onChange).toHaveBeenCalledWith({ email: 'x@y.com', page: 1 });
  });

  it('calls onChange with perPage and page=1 when perPage changes', () => {
    render(<UsersFilters role="user" filters={baseFilters} onChange={onChange} />);
    const select = screen.getAllByTestId('select-filters.user_per_page')[0];
    fireEvent.change(select, { target: { value: '20' } });
    expect(onChange).toHaveBeenCalledWith({ perPage: 20, page: 1 });
  });

  it('resets filters to defaults when reset clicked', () => {
    render(<UsersFilters role="user" filters={baseFilters} onChange={onChange} />);
    const sidebar = screen.getByRole('complementary');
    const utils = within(sidebar);

    const resetBtn = utils.getByRole('button', { name: 'filters.reset' });
    fireEvent.click(resetBtn);

    expect(onChange).toHaveBeenCalledWith({
      firstname: '',
      lastname: '',
      email: '',
      perPage: 10,
      page: 1,
    });
  });

  it('opens and closes mobile drawer via icon buttons', () => {
    render(
      <UsersFilters role="user" filters={baseFilters} onChange={onChange} />
    );
    const menuBtn = screen.getByLabelText('filters.title');
    fireEvent.click(menuBtn);
    const closeBtn = screen.getByLabelText('filters.close');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(screen.getByLabelText('filters.close')).toBeInTheDocument();
  });

  it('toggles drawer open and closed on stub clicks', () => {
    render(<UsersFilters role="user" filters={baseFilters} onChange={onChange} />);

    expect(screen.getByTestId('drawer-false')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('filters.title'));
    expect(screen.getByTestId('drawer-true')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('drawer-true'));
    expect(screen.getByTestId('drawer-false')).toBeInTheDocument();
  });
});
