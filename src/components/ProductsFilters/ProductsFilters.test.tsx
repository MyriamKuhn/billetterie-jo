import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsFilters } from './ProductsFilters';

// 1️⃣ Spy global pour Box
;(globalThis as any).BoxMock = vi.fn((props: any) => <div data-testid="box">{props.children}</div>);
vi.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: (props: any) => (globalThis as any).BoxMock(props),
}));

// 2️⃣ Spy global pour Drawer
;(globalThis as any).DrawerMock = vi.fn((props: any) =>
  props.open ? <div data-testid="drawer">{props.children}</div> : null
);
vi.mock('@mui/material/Drawer', () => ({
  __esModule: true,
  default: (props: any) => (globalThis as any).DrawerMock(props),
}));

// 3️⃣ Autres mocks
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key, i18n: { changeLanguage: async () => {} } }),
}));
vi.mock('@mui/material/styles', () => ({
  __esModule: true,
  useTheme: () => ({ mixins: { toolbar: { minHeight: 56 } }, palette: { divider: '#000' } }),
}));
vi.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="typography">{props.children}</div>,
}));
vi.mock('@mui/material/IconButton', () => ({
  __esModule: true,
  default: (props: any) => (
    <button data-testid={props['aria-label']} onClick={props.onClick}>
      {props.children}
    </button>
  ),
}));
vi.mock('@mui/icons-material/Menu', () => ({ __esModule: true, default: () => <span data-testid="menu-icon" /> }));
vi.mock('@mui/icons-material/Close', () => ({ __esModule: true, default: () => <span data-testid="close-icon" /> }));
vi.mock('../FilterField', () => ({
  __esModule: true,
  FilterField: (p: any) => (
    <input
      data-testid={`field-${p.label}`}
      value={p.value}
      onChange={e => p.onChange(e.target.value)}
    />
  ),
}));
vi.mock('../FilterSelect', () => ({
  __esModule: true,
  FilterSelect: (p: any) => (
    <select data-testid="select" value={p.value} onChange={e => p.onChange(Number(e.target.value))}>
      {p.options.map((o: any) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  ),
}));
vi.mock('../FilterRadios', () => ({
  __esModule: true,
  FilterRadios: (p: any) => (
    <div data-testid="radios">
      {p.options.map((o: any) => (
        <label key={o.value}>
          <input
            type="radio"
            name="places"
            value={o.value}
            checked={p.value === o.value}
            onChange={() => p.onChange(o.value)}
          />
          {o.label}
        </label>
      ))}
    </div>
  ),
}));
vi.mock('../SortControl', () => ({
  __esModule: true,
  SortControl: (p: any) => (
    <div data-testid="sortcontrol">
      <button data-testid="sort-field" onClick={() => p.onSortChange(p.fields[1].value, p.order)}>
        Field
      </button>
      <button
        data-testid="sort-order"
        onClick={() =>
          p.onSortChange(p.sortBy, p.order === 'asc' ? 'desc' : 'asc')
        }
      >
        Order
      </button>
    </div>
  ),
}));
vi.mock('@mui/x-date-pickers/DatePicker', () => ({
  __esModule: true,
  DatePicker: (p: any) => (
    <input
      data-testid="datepicker"
      value={p.value ? p.value.format('YYYY-MM-DD') : ''}
      onChange={e =>
        p.onChange(
          e.target.value ? ({ format: () => e.target.value } as any) : null
        )
      }
    />
  ),
}));

describe('<ProductsFilters />', () => {
  let onChange: ReturnType<typeof vi.fn>;
  const initialFilters = {
    name: '',
    category: '',
    location: '',
    date: '',
    places: 0,
    sortBy: 'name' as const,
    order: 'asc' as const,
    perPage: 15,
    page: 1,
  };

  beforeEach(() => {
    onChange = vi.fn();
    (globalThis as any).BoxMock.mockClear();
    (globalThis as any).DrawerMock.mockClear();
  });

  it('rends bien le composant Drawer avec keepMounted dès le mount', () => {
    render(<ProductsFilters filters={initialFilters} onChange={onChange} />);
    // Le spy DrawerMock doit avoir été appelé au moins une fois
    expect((globalThis as any).DrawerMock).toHaveBeenCalled();
    // Et la prop keepMounted doit être true sur la première invocation
    const firstCallProps = (globalThis as any).DrawerMock.mock.calls[0][0];
    expect(firstCallProps.keepMounted).toBe(true);
  });

  it('renders desktop content with all controls', () => {
    render(<ProductsFilters filters={initialFilters} onChange={onChange} />);
    expect(screen.getByTestId('typography')).toBeInTheDocument();
    expect(screen.getByTestId('field-filters.name')).toHaveValue('');
    expect(screen.getByTestId('field-filters.category')).toHaveValue('');
    expect(screen.getByTestId('field-filters.location')).toHaveValue('');
    expect(screen.getByTestId('datepicker')).toHaveValue('');
    expect(screen.getByTestId('radios')).toBeInTheDocument();
    expect(screen.getByTestId('sortcontrol')).toBeInTheDocument();
    expect(screen.getByTestId('select')).toHaveValue('15');
    expect(screen.getByRole('button', { name: 'filters.reset' })).toBeInTheDocument();
  });

  it('calls onChange for text fields resetting page', () => {
    render(<ProductsFilters filters={initialFilters} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('field-filters.name'), { target: { value: 'foo' } });
    expect(onChange).toHaveBeenCalledWith({ name: 'foo', page: 1 });
  });

  it('datepicker change triggers onChange date', () => {
    render(<ProductsFilters filters={initialFilters} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('datepicker'), { target: { value: '2025-05-29' } });
    expect(onChange).toHaveBeenCalledWith({ date: '2025-05-29', page: 1 });
  });

  it('radios change triggers onChange places', () => {
    render(<ProductsFilters filters={initialFilters} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('filters.one_place'));
    expect(onChange).toHaveBeenCalledWith({ places: 1, page: 1 });
  });

  it('sortcontrol calls onSortChange', () => {
    render(<ProductsFilters filters={initialFilters} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('sort-field'));
    expect(onChange).toHaveBeenCalledWith({
      sortBy: 'price',
      order: 'asc',
      page: 1,
    });
    onChange.mockClear();
    fireEvent.click(screen.getByTestId('sort-order'));
    expect(onChange).toHaveBeenCalledWith({
      sortBy: 'name',
      order: 'desc',
      page: 1,
    });
  });

  it('select change triggers onChange perPage', () => {
    render(<ProductsFilters filters={initialFilters} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('select'), { target: { value: '5' } });
    expect(onChange).toHaveBeenCalledWith({ perPage: 5, page: 1 });
  });

  it('reset button resets all filters', () => {
    const filters = {
      ...initialFilters,
      name: 'x',
      category: 'y',
      location: 'z',
      date: '2025-01-01',
      places: 2,
      sortBy: 'price' as const,
      order: 'desc' as const,
      perPage: 5,
    };
    render(<ProductsFilters filters={filters} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'filters.reset' }));
    expect(onChange).toHaveBeenCalledWith({
      name: '',
      category: '',
      location: '',
      date: '',
      places: 0,
      sortBy: 'name',
      order: 'asc',
      perPage: 15,
      page: 1,
    });
  });

  it('opens and closes mobile drawer', () => {
    render(<ProductsFilters filters={initialFilters} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('filters.title'));
    expect(screen.getByTestId('drawer')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('filters.close'));
    expect(screen.queryByTestId('drawer')).toBeNull();
  });

  it('appelle onChange pour le champ category', () => {
    render(<ProductsFilters filters={initialFilters} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('field-filters.category'), { target: { value: 'FooCat' } });
    expect(onChange).toHaveBeenCalledWith({ category: 'FooCat', page: 1 });
  });

  it('appelle onChange pour le champ location', () => {
    render(<ProductsFilters filters={initialFilters} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('field-filters.location'), { target: { value: 'Paris' } });
    expect(onChange).toHaveBeenCalledWith({ location: 'Paris', page: 1 });
  });

  it('le sx.border du Box desktop renvoie la bonne valeur CSS', () => {
    render(<ProductsFilters filters={initialFilters} onChange={onChange} />);
    const calls = (globalThis as any).BoxMock.mock.calls as Array<[any]>;
    const asideCall = calls.find(([props]) => props.component === 'aside');
    expect(asideCall).toBeDefined();
    const sx = asideCall![0].sx;
    expect(typeof sx.border).toBe('function');
    const css = sx.border!({ palette: { divider: '#00FF00' } });
    expect(css).toBe('1px solid #00FF00');
  });

  it('drawer reçoit la prop keepMounted et passe open false/true', () => {
    render(<ProductsFilters filters={initialFilters} onChange={onChange} />);
    // ouvrir
    fireEvent.click(screen.getByTestId('filters.title'));
    const openCall = (globalThis as any).DrawerMock.mock.calls.find(
      ([props]: any[]) => props.open === true
    );
    expect(openCall).toBeDefined();
    expect(openCall![0].keepMounted).toBe(true);
    // fermer
    fireEvent.click(screen.getByTestId('filters.close'));
    const closeCall = (globalThis as any).DrawerMock.mock.calls.find(
      ([props]: any[]) => props.open === false
    );
    expect(closeCall).toBeDefined();
    expect(closeCall![0].keepMounted).toBe(true);
  });
});
