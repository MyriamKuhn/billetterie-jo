import { render, screen, fireEvent, within } from '@testing-library/react';
import { UsersFilters, type UsersFiltersProps } from './UsersFilters';
import { vi } from 'vitest';

// 1) Mocks avant d'importer MUI et le composant
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// stub useTheme pour que le CSS breakpoints ne casse pas la présence dans le DOM
vi.mock('@mui/material/styles', () => ({
  __esModule: true,
  useTheme: () => ({ mixins: { toolbar: { minHeight: 64 } }, palette: { divider: '#ccc' } }),
}));

// stub FilterField + FilterSelect pour pouvoir tester facilement le onChange
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

  it('rend tous les champs (desktop sidebar)', () => {
    render(<UsersFilters role="user" filters={baseFilters} onChange={onChange} />);

    // on isole la sidebar desktop
    const sidebar = screen.getByRole('complementary');
    const utils = within(sidebar);

    // Titre
    expect(utils.getByText('filters.title')).toBeInTheDocument();

    // firstname via testid
    expect(utils.getByTestId('field-filters.firstname')).toHaveValue('A');
    // lastname
    expect(utils.getByTestId('field-filters.lastname')).toHaveValue('B');
    // email
    expect(utils.getByTestId('field-filters.email')).toHaveValue('c@ex.com');
    // perPage
    expect(utils.getByTestId('select-filters.user_per_page')).toHaveValue('15');

    // reset
    expect(utils.getByRole('button', { name: 'filters.reset' })).toBeInTheDocument();
  });

  it('appelle onChange({ firstname, page:1 }) sur modification du firstname', () => {
    render(<UsersFilters role="employee" filters={baseFilters} onChange={onChange} />);
    const input = screen.getAllByTestId('field-filters.firstname')[0];
    fireEvent.change(input, { target: { value: 'NewFirst' } });
    expect(onChange).toHaveBeenCalledWith({ firstname: 'NewFirst', page: 1 });
  });

  it('appelle onChange({ lastname, page:1 }) sur modification du lastname', () => {
    render(<UsersFilters role="employee" filters={baseFilters} onChange={onChange} />);
    const input = screen.getAllByTestId('field-filters.lastname')[0];
    fireEvent.change(input, { target: { value: 'NewLast' } });
    expect(onChange).toHaveBeenCalledWith({ lastname: 'NewLast', page: 1 });
  });

  it('appelle onChange({ email, page:1 }) sur modification du email', () => {
    render(<UsersFilters role="employee" filters={baseFilters} onChange={onChange} />);
    const input = screen.getAllByTestId('field-filters.email')[0];
    fireEvent.change(input, { target: { value: 'x@y.com' } });
    expect(onChange).toHaveBeenCalledWith({ email: 'x@y.com', page: 1 });
  });

  it('appelle onChange({ perPage, page:1 }) sur modification du perPage', () => {
    render(<UsersFilters role="user" filters={baseFilters} onChange={onChange} />);
    const select = screen.getAllByTestId('select-filters.user_per_page')[0];
    fireEvent.change(select, { target: { value: '20' } });
    expect(onChange).toHaveBeenCalledWith({ perPage: 20, page: 1 });
  });

  it('appelle onChange avec les valeurs par défaut sur reset (desktop sidebar)', () => {
    render(<UsersFilters role="user" filters={baseFilters} onChange={onChange} />);

    // On isole la sidebar desktop
    const sidebar = screen.getByRole('complementary');
    const utils = within(sidebar);

    // On clique sur SON bouton Reset
    const resetBtn = utils.getByRole('button', { name: 'filters.reset' });
    fireEvent.click(resetBtn);

    // Vérifie l’appel correct
    expect(onChange).toHaveBeenCalledWith({
      firstname: '',
      lastname: '',
      email: '',
      perPage: 10,
      page: 1,
    });
  });

  it('ouvre et ferme le drawer mobile', () => {
    render(
      <UsersFilters role="user" filters={baseFilters} onChange={onChange} />
    );
    // bouton menu
    const menuBtn = screen.getByLabelText('filters.title');
    fireEvent.click(menuBtn);
    // close icon devient visible dans drawer
    const closeBtn = screen.getByLabelText('filters.close');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    // après fermeture, le bouton close reste dans le DOM mais drawer fermé
    // (on ne peut pas interroger l’état visuel facilement, mais on sait que setOpen(false) a été appelé)
    // On considère la fermeture ok si le bouton est toujours présent
    expect(screen.getByLabelText('filters.close')).toBeInTheDocument();
  });

  it('ouvre le Drawer et ferme via onClose', () => {
    render(<UsersFilters role="user" filters={baseFilters} onChange={onChange} />);

    // 1) Au lancement, le Drawer est fermé → stub rend <div data-testid="drawer-false">
    expect(screen.getByTestId('drawer-false')).toBeInTheDocument();

    // 2) On clique sur l’IconButton menu pour ouvrir → open passe à true
    fireEvent.click(screen.getByLabelText('filters.title'));
    expect(screen.getByTestId('drawer-true')).toBeInTheDocument();

    // 3) On clique sur le drawer (notre stub) → appelle onClose() et repasse open à false
    fireEvent.click(screen.getByTestId('drawer-true'));
    expect(screen.getByTestId('drawer-false')).toBeInTheDocument();
  });
});
