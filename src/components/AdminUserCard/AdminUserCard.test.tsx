import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminUserCard } from './AdminUserCard';
import type { User } from '../../types/user';

// --- Mocks ---
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      opts && opts.id !== undefined
        ? `${key}-${opts.id}`
        : key.replace(/\{\{(\w+)\}\}/g, (_, v) => opts?.[v] ?? ''),
  }),
}));

const notifyMock = vi.fn();
vi.mock('../../hooks/useCustomSnackbar', () => ({
  useCustomSnackbar: () => ({ notify: notifyMock }),
}));

vi.mock('../../utils/format', () => ({
  formatDate: (iso: string, lang: string) => `DATE(${iso},${lang})`,
  formatTime: (iso: string, lang: string) => `TIME(${iso},${lang})`,
}));

// --- Fixtures ---
const baseUser: User = {
  id: 42,
  firstname: 'Alice',
  lastname: 'Dupont',
  email: 'alice@example.com',
  role: 'admin',
  is_active: true,
  twofa_enabled: false,
  created_at: '2024-01-02T03:04:05Z',
  updated_at: null,
  email_verified_at: null,
};

describe('AdminUserCard (non-employee)', () => {
  const onView = vi.fn();
  const onSave = vi.fn();
  const onRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, chips and created date only', () => {
    render(
      <AdminUserCard
        lang="fr"
        user={baseUser}
        isEmployee={false}
        onViewDetails={onView}
        onSave={onSave}
        onRefresh={onRefresh}
      />
    );
    expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent('user.title-42');
    expect(screen.getByText('user.active')).toBeInTheDocument();
    expect(screen.getByText('user.twofa_disabled')).toBeInTheDocument();
    expect(screen.getByText('user.email_not_verified')).toBeInTheDocument();
    expect(screen.getByText('user.created_on')).toBeInTheDocument();
    expect(screen.queryByText('user.updated_on')).toBeNull();
  });

  it('rend les champs modifiables et active Save quand dirty', async () => {
    render(
      <AdminUserCard
        lang="en"
        user={baseUser}
        isEmployee={false}
        onViewDetails={onView}
        onSave={onSave}
        onRefresh={onRefresh}
      />
    );
    // inputs initialement peuplés
    const first = screen.getByLabelText('user.firstname') as HTMLInputElement;
    const last = screen.getByLabelText('user.lastname') as HTMLInputElement;
    const mail = screen.getByLabelText('user.email') as HTMLInputElement;
    expect(first.value).toBe('Alice');
    expect(last.value).toBe('Dupont');
    expect(mail.value).toBe('alice@example.com');

    // Save désactivé tant que rien ne change
    const saveBtn = screen.getByRole('button', { name: 'user.save' });
    expect(saveBtn).toBeDisabled();

    // Modification d'un champ
    await userEvent.clear(first);
    await userEvent.type(first, 'Alicia');
    expect(saveBtn).toBeEnabled();
  });

  it('toggle active, puis save success', async () => {
    onSave.mockResolvedValueOnce(true);
    render(
      <AdminUserCard
        lang="en"
        user={baseUser}
        isEmployee={false}
        onViewDetails={onView}
        onSave={onSave}
        onRefresh={onRefresh}
      />
    );

    // toggle active → devient false
    const activeSwitch = screen.getByLabelText('user.toggle_active');
    expect(activeSwitch).toBeChecked();
    await userEvent.click(activeSwitch);
    expect(activeSwitch).not.toBeChecked();

    // Save
    const saveBtn = screen.getByRole('button', { name: 'user.save' });
    expect(saveBtn).toBeEnabled();
    await userEvent.click(saveBtn);

    // onSave est appelé avec le payload complet
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(42, {
        is_active: false,
        twofa_enabled: false,
        firstname: 'Alice',
        lastname: 'Dupont',
        email: 'alice@example.com',
        role: 'user',
        verify_email: false,
      })
    );
    // notification de succès et refresh
    expect(notifyMock).toHaveBeenCalledWith('user.success', 'success');
    expect(onRefresh).toHaveBeenCalled();
  });

  it('save failure affiche notification d’erreur', async () => {
    onSave.mockResolvedValueOnce(false);
    render(
      <AdminUserCard
        lang="en"
        user={baseUser}
        isEmployee={false}
        onViewDetails={onView}
        onSave={onSave}
        onRefresh={onRefresh}
      />
    );

    // rendre dirty
    await userEvent.clear(screen.getByLabelText('user.lastname'));
    await userEvent.type(screen.getByLabelText('user.lastname'), 'Dupond');

    // click save
    await userEvent.click(screen.getByRole('button', { name: 'user.save' }));
    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith('errors.save_failed', 'error')
    );
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('onViewDetails est appelé correctement', () => {
    render(
      <AdminUserCard
        lang="en"
        user={baseUser}
        isEmployee={false}
        onViewDetails={onView}
        onSave={onSave}
        onRefresh={onRefresh}
      />
    );
    fireEvent.click(screen.getByText('user.see_details'));
    expect(onView).toHaveBeenCalledWith(42);
  });

  it('toggle_verify_email fonctionne puis désactive switch', async () => {
    render(
      <AdminUserCard
        lang="en"
        user={baseUser}
        isEmployee={false}
        onViewDetails={onView}
        onSave={onSave}
        onRefresh={onRefresh}
      />
    );
    const verifySwitch = screen.getByLabelText('user.toggle_verify_email');
    // initial false → enabled
    expect(verifySwitch).not.toBeChecked();
    expect(verifySwitch).toBeEnabled();
    await userEvent.click(verifySwitch);
    expect(verifySwitch).toBeChecked();
    // une fois checked, il devient disabled
    expect(verifySwitch).toBeDisabled();
  });
});

describe('AdminUserCard (employee)', () => {
  const onView = vi.fn();
  const onSave = vi.fn();
  const onRefresh = vi.fn();
  // user avec twofa=true et updated_at, email_verified_at
  const empUser: User = {
    ...baseUser,
    twofa_enabled: true,
    email_verified_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-02-02T02:02:02Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre et chips spécifiques employee', () => {
    render(
      <AdminUserCard
        lang="fr"
        user={empUser}
        isEmployee={true}
        onViewDetails={onView}
        onSave={onSave}
        onRefresh={onRefresh}
      />
    );
    expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent(
      'user.title_employee-42'
    );
    expect(screen.getByText('user.twofa_enabled')).toBeInTheDocument();
    expect(screen.getByText('user.email_verified')).toBeInTheDocument();
    expect(screen.getByText('user.created_on')).toBeInTheDocument();
    expect(screen.getByText('user.updated_on')).toBeInTheDocument();
  });

  it('toggle_twofa est activé et non désactivé, puis save avec message employee', async () => {
    onSave.mockResolvedValue(true);
    render(
      <AdminUserCard
        lang="en"
        user={empUser}
        isEmployee={true}
        onViewDetails={onView}
        onSave={onSave}
        onRefresh={onRefresh}
      />
    );
    const twofaSwitch = screen.getByLabelText('user.toggle_twofa');
    // initial true → checked et enabled
    expect(twofaSwitch).toBeChecked();
    expect(twofaSwitch).toBeEnabled();
    // toggle off
    await userEvent.click(twofaSwitch);
    expect(twofaSwitch).not.toBeChecked();

    // rendre dirty et save
    await userEvent.clear(screen.getByLabelText('user.email'));
    await userEvent.type(screen.getByLabelText('user.email'), 'new@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'user.save' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(42, {
        is_active: true,
        twofa_enabled: false,
        firstname: 'Alice',
        lastname: 'Dupont',
        email: 'new@example.com',
        role: 'employee',
        verify_email: true,
      })
    );
    expect(notifyMock).toHaveBeenCalledWith('user.success_employee', 'success');
    expect(onRefresh).toHaveBeenCalled();
  });
});
