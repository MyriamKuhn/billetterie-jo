import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminEmployeesPage from './AdminEmployeesPage';
import * as useUsersHook from '../hooks/useUsers';
import * as useAuthStore from '../stores/useAuthStore';
import * as useLangStore from '../stores/useLanguageStore';
import * as useUserUpdateHook from '../hooks/useUserUpdate';
import type { User } from '../types/user';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Mock external dependencies
vi.mock('react-i18next', () => ({ useTranslation: vi.fn().mockReturnValue({ t: (key: string) => key }) }));
vi.mock('../stores/useAuthStore', () => ({ useAuthStore: vi.fn() }));
vi.mock('../stores/useLanguageStore', () => ({ useLanguageStore: vi.fn() }));
vi.mock('../hooks/useUsers', () => ({ useUsers: vi.fn() }));
vi.mock('../hooks/useUserUpdate', () => ({ useUserUpdate: vi.fn() }));

// Mock UI components
vi.mock('@mui/material/Pagination', () => ({
  default: (props: any) => (
    <button data-testid="pagination" data-count={props.count} data-page={props.page} onClick={() => props.onChange(null, props.page + 1)}>
      {props.page}
    </button>
  ),
}));
vi.mock('../components/OlympicLoader', () => ({ default: () => <div data-testid="loader" /> }));
vi.mock('../components/Seo', () => ({ default: () => null }));
vi.mock('../components/PageWrapper', () => ({ PageWrapper: (props: any) => <div data-testid="wrapper">{props.children}</div> }));
vi.mock('../components/ErrorDisplay', () => ({
  ErrorDisplay: ({ retryButtonText, onRetry, homeButtonText }: any) => (
    <div data-testid="error">
      <button data-testid="retry" onClick={onRetry}>{retryButtonText}</button>
      <button data-testid="home">{homeButtonText}</button>
    </div>
  ),
}));
vi.mock('../components/UsersFilters', () => ({
  UsersFilters: ({ filters, onChange, role }: any) => (
    <button
      data-testid="filters"
      data-firstname={filters.firstname}
      data-lastname={filters.lastname}
      data-email={filters.email}
      data-page={filters.page}
      onClick={() => onChange({ ...filters, page: filters.page + 1 })}
    >
      filters:{role}-{filters.page}
    </button>
  ),
}));
vi.mock('../components/AdminUserGrid', () => ({
  AdminUserGrid: ({ users, onViewDetails, onSave, onRefresh, onCreate, isEmployee }: any) => (
    <div data-testid="grid">
      <span data-testid="grid-users">{users.map((u: User) => u.id).join(',')}</span>
      <button data-testid="view" onClick={() => onViewDetails(users[0]?.id)}>view</button>
      <button data-testid="save" onClick={() => onSave(users[0].id, users[0])}>save</button>
      <button data-testid="refresh" onClick={onRefresh}>refresh</button>
      <button data-testid="createBtn" onClick={() => isEmployee && onCreate()}>create</button>
    </div>
  ),
}));
vi.mock('../components/AdminUserDetailsModal', () => ({
  AdminUserDetailsModal: ({ open, onClose }: any) =>
    open ? <div data-testid="details"><button data-testid="closeDetails" onClick={onClose} /></div> : null,
}));
vi.mock('../components/AdminEmployeeCreateModal', () => ({
  AdminEmployeeCreateModal: ({ open, onClose, onRefresh }: any) =>
    open ? (
      <div data-testid="createModal">
        <button data-testid="refreshModal" onClick={onRefresh} />
        <button data-testid="closeCreate" onClick={onClose} />
      </div>
    ) : null,
}));

describe('AdminEmployeesPage', () => {
  const fakeToken = 'tok-xyz';
  const fakeLang = 'fr';

  beforeEach(() => {
    // Mock selector-based stores to execute selector functions in page code
    vi.mocked(useAuthStore.useAuthStore).mockImplementation((selector: any) => selector({ authToken: fakeToken }));
    vi.mocked(useLangStore.useLanguageStore).mockImplementation((selector: any) => selector({ lang: fakeLang }));
  });

  it('shows ErrorDisplay and retry works', () => {
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [], total: 0, loading: false, error: 'ERR', validationErrors: null });
    render(<AdminEmployeesPage />);
    expect(screen.getByTestId('error')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('retry'));
    expect(screen.getByTestId('error')).toBeInTheDocument();
  });

  it('shows loader when loading', () => {
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [], total: 0, loading: true, error: null, validationErrors: null });
    render(<AdminEmployeesPage />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders grid and handles filter, refresh, save', async () => {
    const mockUsers: User[] = [{ id: 7, firstname: 'A', lastname: 'B', email: 'a@b', email_verified_at: null, role: 'employee', is_active: true, twofa_enabled: false, created_at: '', updated_at: '' }];
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: mockUsers, total: 5, loading: false, error: null, validationErrors: null });
    const fakeUpdate = vi.fn().mockResolvedValue(true);
    vi.mocked(useUserUpdateHook.useUserUpdate).mockReturnValue(fakeUpdate);

    render(<AdminEmployeesPage />);
    expect(screen.getByTestId('grid-users').textContent).toBe('7');

    fireEvent.click(screen.getByTestId('filters'));
    fireEvent.click(screen.getByTestId('refresh'));
    fireEvent.click(screen.getByTestId('save'));
    expect(fakeUpdate).toHaveBeenCalledWith(7, expect.objectContaining({ role: 'employee' }));
  });

  it('handles pagination fallback count and change', async () => {
    const mockUsers: User[] = [{ id: 9, firstname: 'T', lastname: 'U', email: 't@u', email_verified_at: null, role: 'employee', is_active: true, twofa_enabled: false, created_at: '', updated_at: '' }];
    // total = 0 triggers fallback to 1
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: mockUsers, total: 0, loading: false, error: null, validationErrors: null });
    render(<AdminEmployeesPage />);
    const pag = screen.getByTestId('pagination');
    expect(pag).toHaveAttribute('data-count', '1');

    // total >0, page change
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: mockUsers, total: 10, loading: false, error: null, validationErrors: null });
    fireEvent.click(pag);
    await waitFor(() => expect(screen.getByTestId('filters').textContent).toContain('filters:employee-2'));
  });

  it('opens and closes details modal', () => {
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [{ id: 5, firstname: 'M', lastname: 'N', email: 'm@n', email_verified_at: null, role: 'employee', is_active: true, twofa_enabled: false, created_at: '', updated_at: '' }], total: 1, loading: false, error: null, validationErrors: null });
    render(<AdminEmployeesPage />);
    fireEvent.click(screen.getByTestId('view'));
    expect(screen.getByTestId('details')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('closeDetails'));
    expect(screen.queryByTestId('details')).toBeNull();
  });

  it('handles create modal and modal refresh', async () => {
    const mockUseUsers = vi.fn().mockReturnValue({ users: [{ id: 2, firstname: 'C', lastname: 'D', email: 'c@d', email_verified_at: null, role: 'employee', is_active: true, twofa_enabled: false, created_at: '', updated_at: '' }], total: 1, loading: false, error: null, validationErrors: null });
    vi.mocked(useUsersHook.useUsers).mockImplementation(() => mockUseUsers());
    render(<AdminEmployeesPage />);
    expect(mockUseUsers).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('createBtn'));
    expect(mockUseUsers).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByTestId('refreshModal'));
    await waitFor(() => expect(mockUseUsers).toHaveBeenCalledTimes(3));
    fireEvent.click(screen.getByTestId('closeCreate'));
    expect(screen.queryByTestId('createModal')).toBeNull();
  });

  it('cleans filters on validation errors per field', async () => {
    // combined errors
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [], total: 0, loading: false, error: null, validationErrors: { firstname: ['x'], lastname: ['y'], email: ['z'] } });
    render(<AdminEmployeesPage />);
    await waitFor(() => {
      const btn = screen.getByTestId('filters');
      expect(btn).toHaveAttribute('data-firstname', '');
      expect(btn).toHaveAttribute('data-lastname', '');
      expect(btn).toHaveAttribute('data-email', '');
    });
  });

  it('cleans only firstname when only firstname error', async () => {
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [], total: 0, loading: false, error: null, validationErrors: { firstname: ['err'] } });
    render(<AdminEmployeesPage />);
    await waitFor(() => expect(screen.getByTestId('filters')).toHaveAttribute('data-firstname', ''));
  });

  it('cleans only lastname when only lastname error', async () => {
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [], total: 0, loading: false, error: null, validationErrors: { lastname: ['err'] } });
    render(<AdminEmployeesPage />);
    await waitFor(() => expect(screen.getByTestId('filters')).toHaveAttribute('data-lastname', ''));
  });

  it('cleans only email when only email error', async () => {
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [], total: 0, loading: false, error: null, validationErrors: { email: ['err'] } });
    render(<AdminEmployeesPage />);
    await waitFor(() => expect(screen.getByTestId('filters')).toHaveAttribute('data-email', ''));
  });
});
