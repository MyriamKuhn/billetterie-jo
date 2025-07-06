import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminEmployeeCreateModal } from './AdminEmployeeCreateModal';

// on mocke les hooks externes
vi.mock('../../hooks/useCreateEmployee');
vi.mock('../../hooks/useCustomSnackbar');
vi.mock('react-i18next');

// on mocke PasswordWithConfirmation en export default
vi.mock('../PasswordWithConfirmation', () => ({
  __esModule: true,
  default: ({
    password,
    onPasswordChange,
    confirmPassword,
    onConfirmChange,
    touched,
    onBlur
  }: any) => (
    <div>
      <input
        aria-label="Password"
        type="password"
        value={password}
        onChange={e => onPasswordChange(e.target.value)}
        onBlur={onBlur}
      />
      <input
        aria-label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={e => onConfirmChange(e.target.value)}
        onBlur={onBlur}
      />
      {touched && password !== confirmPassword && <span>Password mismatch</span>}
    </div>
  )
}));

import { useCreateEmployee } from '../../hooks/useCreateEmployee';
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar';
import { useTranslation } from 'react-i18next';
import type { Mock } from 'vitest';

describe('AdminEmployeeCreateModal', () => {
  let mockCreateEmployee: ReturnType<typeof vi.fn>;
  let mockNotify: ReturnType<typeof vi.fn>;
  const onClose = vi.fn();
  const onRefresh = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    onRefresh.mockClear();

    mockCreateEmployee = vi.fn();
    (useCreateEmployee as Mock).mockReturnValue(mockCreateEmployee);

    mockNotify = vi.fn();
    (useCustomSnackbar as Mock).mockReturnValue({ notify: mockNotify });

    (useTranslation as Mock).mockReturnValue({ t: (key: string) => key });
  });

  it('affiche tous les champs et le titre quand open=true', () => {
    render(<AdminEmployeeCreateModal open={true} onClose={onClose} onRefresh={onRefresh} />);
    expect(screen.getByText('employee.create_new')).toBeInTheDocument();
    expect(screen.getByLabelText('user.lastname')).toBeInTheDocument();
    expect(screen.getByLabelText('user.firstname')).toBeInTheDocument();
    expect(screen.getByLabelText('user.email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('désactive le bouton Create tant que le formulaire n’est pas valide', async () => {
    render(<AdminEmployeeCreateModal open onClose={onClose} onRefresh={onRefresh} />);
    const createBtn = screen.getByRole('button', { name: 'employee.create' });
    expect(createBtn).toBeDisabled();

    await userEvent.type(screen.getByLabelText('user.lastname'), 'Dupont');
    await userEvent.type(screen.getByLabelText('user.firstname'), 'Jean');
    await userEvent.type(screen.getByLabelText('user.email'), 'wrong-email');
    fireEvent.blur(screen.getByLabelText('user.email'));
    expect(await screen.findByText('employee.invalid_email')).toBeInTheDocument();
    expect(createBtn).toBeDisabled();

    await userEvent.clear(screen.getByLabelText('user.email'));
    await userEvent.type(screen.getByLabelText('user.email'), 'jean@exemple.com');
    await userEvent.type(screen.getByLabelText('Password'), 'abcd1234');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'abcd1234');

    expect(createBtn).toBeEnabled();
  });

  it('appelle createEmployee et traite le succès', async () => {
    mockCreateEmployee.mockResolvedValue(true);
    render(<AdminEmployeeCreateModal open onClose={onClose} onRefresh={onRefresh} />);

    // remplissage du formulaire
    await userEvent.type(screen.getByLabelText('user.lastname'), 'Dupont');
    await userEvent.type(screen.getByLabelText('user.firstname'), 'Jean');
    await userEvent.type(screen.getByLabelText('user.email'), 'jean@exemple.com');
    await userEvent.type(screen.getByLabelText('Password'), 'abcd1234');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'abcd1234');

    const createBtn = screen.getByRole('button', { name: 'employee.create' });
    await userEvent.click(createBtn);    // on appelle createEmployee et on attend le résultat
    await waitFor(() => {
      expect(mockCreateEmployee).toHaveBeenCalledWith({
        firstname: 'Jean',
        lastname: 'Dupont',
        email: 'jean@exemple.com',
        password: 'abcd1234',
        password_confirmation: 'abcd1234'
      });
    });

    await waitFor(() => {
      expect(mockCreateEmployee).toHaveBeenCalledWith({
        firstname: 'Jean',
        lastname: 'Dupont',
        email: 'jean@exemple.com',
        password: 'abcd1234',
        password_confirmation: 'abcd1234'
      });
    });

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('employee.success', 'success');
      expect(onRefresh).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('traite l’échec de createEmployee', async () => {
    mockCreateEmployee.mockResolvedValue(false);
    render(<AdminEmployeeCreateModal open onClose={onClose} onRefresh={onRefresh} />);

    await userEvent.type(screen.getByLabelText('user.lastname'), 'Dupont');
    await userEvent.type(screen.getByLabelText('user.firstname'), 'Jean');
    await userEvent.type(screen.getByLabelText('user.email'), 'jean@exemple.com');
    await userEvent.type(screen.getByLabelText('Password'), 'abcd1234');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'abcd1234');

    const createBtn = screen.getByRole('button', { name: 'employee.create' });
    await userEvent.click(createBtn);

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('errors.creation_failed', 'error');
      expect(onRefresh).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('réinitialise le formulaire quand on rouvre le dialog', async () => {
    const { rerender } = render(<AdminEmployeeCreateModal open onClose={onClose} onRefresh={onRefresh} />);

    await userEvent.type(screen.getByLabelText('user.firstname'), 'Marie');
    expect(screen.getByLabelText('user.firstname')).toHaveValue('Marie');

    rerender(<AdminEmployeeCreateModal open={false} onClose={onClose} onRefresh={onRefresh} />);
    rerender(<AdminEmployeeCreateModal open onClose={onClose} onRefresh={onRefresh} />);

    expect(screen.getByLabelText('user.firstname')).toHaveValue('');
  });

  it('le bouton Close déclenche onClose', async () => {
    render(<AdminEmployeeCreateModal open onClose={onClose} onRefresh={onRefresh} />);
    const closeBtn = await screen.findByRole('button', { name: 'user.close' });
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
