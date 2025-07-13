import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminUsersPage from './AdminUsersPage';
import * as useUsersHook from '../hooks/useUsers';
import * as useAuthStore from '../stores/useAuthStore';
import * as useLangStore from '../stores/useLanguageStore';
import * as useUserUpdateHook from '../hooks/useUserUpdate';
import type { User } from '../types/user';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Mocks
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn().mockReturnValue({ t: (key: string) => key, i18n: { language: 'en' } }),
}));
vi.mock('../stores/useAuthStore', () => ({ useAuthStore: vi.fn() }));
vi.mock('../stores/useLanguageStore', () => ({ useLanguageStore: vi.fn() }));
vi.mock('../hooks/useUsers', () => ({ useUsers: vi.fn() }));
vi.mock('../hooks/useUserUpdate', () => ({ useUserUpdate: vi.fn() }));

// UI component mocks
vi.mock('@mui/material/Pagination', () => ({
  default: (props: any) => (
    <button
      data-testid="pagination"
      data-count={props.count}
      data-page={props.page}
      onClick={() => props.onChange(null, props.page + 1)}
    >{props.page}</button>
  ),
}));
vi.mock('../components/OlympicLoader', () => ({ default: () => <div data-testid="loader" /> }));
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
    >filters:{role}-{filters.page}</button>
  ),
}));
vi.mock('../components/AdminUserGrid', () => ({
  AdminUserGrid: ({ users, onViewDetails, onSave, onRefresh, onCreate }: any) => (
    <div data-testid="grid">
      <span data-testid="grid-users">{users.map((u: User) => u.id).join(',')}</span>
      <button data-testid="view" onClick={() => onViewDetails(users[0]?.id)}>view</button>
      <button data-testid="save" onClick={() => onSave(users[0].id, users[0])}>save</button>
      <button data-testid="refresh" onClick={onRefresh}>refresh</button>
      <button data-testid="createBtn" onClick={onCreate}>create</button>
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

describe('AdminUsersPage', () => {
  const fakeToken = 'token123';
  const fakeLang = 'en';

  beforeEach(() => {
    // Execute store selectors
    vi.mocked(useAuthStore.useAuthStore).mockImplementation((sel: any) => sel({ authToken: fakeToken }));
    vi.mocked(useLangStore.useLanguageStore).mockImplementation((sel: any) => sel({ lang: fakeLang }));
  });

  it('renders error and retry works', () => {
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [], total: 0, loading: false, error: 'ERR', validationErrors: null });
    render(<AdminUsersPage />);
    expect(screen.getByTestId('error')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('retry'));
    expect(screen.getByTestId('error')).toBeInTheDocument();
  });

  it('shows loader while loading', () => {
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [], total: 0, loading: true, error: null, validationErrors: null });
    render(<AdminUsersPage />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders grid and handles filter, refresh, save', async () => {
    const user: User = { id: 1, firstname: 'A', lastname: 'B', email: 'a@b', email_verified_at: null, role: 'user', is_active: true, twofa_enabled: false, created_at: '', updated_at: '' };
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [user], total: 2, loading: false, error: null, validationErrors: null });
    const fakeUpdate = vi.fn().mockResolvedValue(true);
    vi.mocked(useUserUpdateHook.useUserUpdate).mockReturnValue(fakeUpdate);

    render(<AdminUsersPage />);
    expect(screen.getByTestId('grid-users').textContent).toBe('1');
    fireEvent.click(screen.getByTestId('filters'));
    fireEvent.click(screen.getByTestId('refresh'));
    fireEvent.click(screen.getByTestId('save'));
    expect(fakeUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ role: 'user' }));
  });

  it('handles pagination fallback and change', async () => {
    const user: User = { id: 2, firstname: 'X', lastname: 'Y', email: 'x@y', email_verified_at: null, role: 'user', is_active: true, twofa_enabled: false, created_at: '', updated_at: '' };
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [user], total: 0, loading: false, error: null, validationErrors: null });
    render(<AdminUsersPage />);
    expect(screen.getByTestId('pagination')).toHaveAttribute('data-count', '1');
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [user], total: 5, loading: false, error: null, validationErrors: null });
    fireEvent.click(screen.getByTestId('pagination'));
    await waitFor(() => expect(screen.getByTestId('filters').textContent).toContain('filters:user-2'));
  });

  it('opens and closes details modal', () => {
    const user: User = { id: 3, firstname: 'M', lastname: 'N', email: 'm@n', email_verified_at: null, role: 'user', is_active: true, twofa_enabled: false, created_at: '', updated_at: '' };
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [user], total: 1, loading: false, error: null, validationErrors: null });
    render(<AdminUsersPage />);
    fireEvent.click(screen.getByTestId('view'));
    expect(screen.getByTestId('details')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('closeDetails'));
    expect(screen.queryByTestId('details')).toBeNull();
  });

  it('handles create modal open, refresh, close', async () => {
    const mockUseUsers = vi.fn().mockReturnValue({ users: [], total: 0, loading: false, error: null, validationErrors: null });
    vi.mocked(useUsersHook.useUsers).mockImplementation(() => mockUseUsers());
    render(<AdminUsersPage />);
    // initial call
    expect(mockUseUsers).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('createBtn'));
    // open modal triggers call
    expect(mockUseUsers).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByTestId('refreshModal'));
    // refresh inside modal
    await waitFor(() => expect(mockUseUsers).toHaveBeenCalledTimes(3));
    fireEvent.click(screen.getByTestId('closeCreate'));
    expect(screen.queryByTestId('createModal')).toBeNull();
  });

  // Validation errors cleanup tests
  it('cleans only firstname on firstname error', async () => {
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [], total: 0, loading: false, error: null, validationErrors: { firstname: ['e'] } });
    render(<AdminUsersPage />);
    await waitFor(() => expect(screen.getByTestId('filters')).toHaveAttribute('data-firstname', ''));
  });

  it('cleans only lastname on lastname error', async () => {
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [], total: 0, loading: false, error: null, validationErrors: { lastname: ['l'] } });
    render(<AdminUsersPage />);
    await waitFor(() => expect(screen.getByTestId('filters')).toHaveAttribute('data-lastname', ''));
  });

  it('cleans only email on email error', async () => {
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ users: [], total: 0, loading: false, error: null, validationErrors: { email: ['m'] } });
    render(<AdminUsersPage />);
    await waitFor(() => expect(screen.getByTestId('filters')).toHaveAttribute('data-email', ''));
  });
});
