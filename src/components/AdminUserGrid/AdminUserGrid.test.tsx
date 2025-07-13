import { render, screen, fireEvent } from '@testing-library/react';
import { AdminUserGrid } from './AdminUserGrid';
import { vi } from 'vitest';
import type { User } from '../../types/user';

// mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// stub CreateEmployeeCard
vi.mock('../CreateEmployeeCard', () => ({
  CreateEmployeeCard: ({ onCreate }: { onCreate: () => void }) => (
    <button data-testid="create-employee" onClick={onCreate}>
      create
    </button>
  ),
}));

// stub AdminUserCard
vi.mock('../AdminUserCard', () => ({
  AdminUserCard: ({
    user,
    onViewDetails,
  }: {
    user: User;
    onViewDetails: () => void;
  }) => (
    <div data-testid={`user-card-${user.id}`}>
      <span data-testid={`user-name-${user.id}`}>{user.firstname}</span>
      <button data-testid={`view-${user.id}`} onClick={onViewDetails}>
        view
      </button>
    </div>
  ),
}));

describe('AdminUserGrid', () => {
  // Note : on a retiré `verify_email`
  const basicUsers: User[] = [
    {
      id: 1,
      firstname: 'Alice',
      lastname: 'Dupont',
      email: 'a@ex.com',
      role: 'user',
      is_active: true,
      twofa_enabled: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-06-01T12:34:56Z',
      email_verified_at: '2025-01-02T08:00:00Z',
    },
    {
      id: 2,
      firstname: 'Bob',
      lastname: 'Martin',
      email: 'b@ex.com',
      role: 'admin',
      is_active: false,
      twofa_enabled: true,
      created_at: '2025-02-03T10:20:30Z',
      updated_at: '2025-06-02T14:15:16Z',
      email_verified_at: null,  // si votre type User autorise null ici
    },
  ];

  const noop = () => Promise.resolve(true);

  it('affiche un message quand users est vide et isEmployee=false', () => {
    render(
      <AdminUserGrid
        lang="fr"
        users={[]}
        onViewDetails={vi.fn()}
        onSave={noop}
        onRefresh={vi.fn()}
        isEmployee={false}
        onCreate={vi.fn()}
      />
    );
    expect(screen.getByText('errors.not_found')).toBeInTheDocument();
  });

  it('affiche un message quand users est vide et isEmployee=true', () => {
    render(
      <AdminUserGrid
        lang="fr"
        users={[]}
        onViewDetails={vi.fn()}
        onSave={noop}
        onRefresh={vi.fn()}
        isEmployee={true}
        onCreate={vi.fn()}
      />
    );
    expect(screen.getByText('errors.not_found_employee')).toBeInTheDocument();
  });

  it('n’affiche pas CreateEmployeeCard quand isEmployee=false', () => {
    const onView = vi.fn();
    render(
      <AdminUserGrid
        lang="en"
        users={basicUsers}
        onViewDetails={onView}
        onSave={noop}
        onRefresh={vi.fn()}
        isEmployee={false}
        onCreate={vi.fn()}
      />
    );
    expect(screen.queryByTestId('create-employee')).toBeNull();

    basicUsers.forEach(u => {
      expect(screen.getByTestId(`user-card-${u.id}`)).toBeInTheDocument();
      fireEvent.click(screen.getByTestId(`view-${u.id}`));
      expect(onView).toHaveBeenLastCalledWith(u.id);
    });
  });

  it('affiche CreateEmployeeCard et les user cards quand isEmployee=true', () => {
    const onView = vi.fn();
    const onCreate = vi.fn();
    render(
      <AdminUserGrid
        lang="en"
        users={basicUsers}
        onViewDetails={onView}
        onSave={noop}
        onRefresh={vi.fn()}
        isEmployee={true}
        onCreate={onCreate}
      />
    );
    expect(screen.getByTestId('create-employee')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('create-employee'));
    expect(onCreate).toHaveBeenCalled();

    basicUsers.forEach(u => {
      expect(screen.getByTestId(`user-card-${u.id}`)).toBeInTheDocument();
    });
  });
});
