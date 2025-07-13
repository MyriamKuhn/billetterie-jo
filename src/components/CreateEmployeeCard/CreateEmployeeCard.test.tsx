import { render, screen, fireEvent } from '@testing-library/react';
import { CreateEmployeeCard } from './CreateEmployeeCard';
import { vi } from 'vitest';

// On mock useTranslation pour renvoyer la clé brute
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('CreateEmployeeCard', () => {
  it('affiche le titre, le texte d’intro et le label du bouton', () => {
    const onCreate = vi.fn();
    render(<CreateEmployeeCard onCreate={onCreate} />);

    // Vérifie que les clés de traduction sont rendues
    expect(screen.getByText('employee.create_new')).toBeInTheDocument();
    expect(screen.getByText('employee.create_intro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'employee.create_button' })).toBeInTheDocument();
  });

  it('appelle onCreate lorsqu’on clique sur le bouton', () => {
    const onCreate = vi.fn();
    render(<CreateEmployeeCard onCreate={onCreate} />);

    const button = screen.getByRole('button', { name: 'employee.create_button' });
    fireEvent.click(button);

    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
