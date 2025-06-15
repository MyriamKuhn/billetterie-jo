/// <reference types="vitest" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { JSX } from 'react';

// --------------------
// Mocks globaux
// --------------------

// Mock de useTranslation pour que t(key) retourne key
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock de useAuthStore
import { useAuthStore } from '../../stores/useAuthStore';
vi.mock('../../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock de useNavigate de react-router-dom
let navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Mock de isStrongPassword
import * as validationUtils from '../../utils/validation';
vi.mock('../../utils/validation', () => ({
  isStrongPassword: vi.fn(),
}));

// Mock de PasswordWithConfirmation
vi.mock('../PasswordWithConfirmation', () => ({
  // Composant de test exposant deux champs <input aria-label="newPassword"> et <input aria-label="confirmPassword">
  default: ({
    password,
    onPasswordChange,
    confirmPassword,
    onConfirmChange,
    onBlur,
  }: any) => (
    <>
      <input
        aria-label="newPassword"
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        onBlur={onBlur}
      />
      <input
        aria-label="confirmPassword"
        type="password"
        value={confirmPassword}
        onChange={(e) => onConfirmChange(e.target.value)}
        onBlur={onBlur}
      />
    </>
  ),
}));

// Mock de updateUserPassword
import * as userService from '../../services/userService';

// Mock de getErrorMessage
import * as errorUtils from '../../utils/errorUtils';
vi.spyOn(errorUtils, 'getErrorMessage').mockImplementation((_t, code) => `Error: ${code}`);

// Import après les mocks
import { PasswordSection } from './PasswordSection';

describe('<PasswordSection />', () => {
  const token = 'fake-token';

  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock = vi.fn();
    // Par défaut, useAuthStore renvoie un token valide
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: any) => any) => {
      return selector({ authToken: token });
    });
    // Par défaut, isStrongPassword retourne true
    (validationUtils.isStrongPassword as Mock).mockReturnValue(true);
  });

  // Utilitaire de rendu avec router
  function renderWithRouter(ui: JSX.Element) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  }

  it('affiche le titre dans l’AccordionSummary', () => {
    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });
    expect(summaryBtn).toBeInTheDocument();
  });

  it('ouvre l’accordéon et affiche les champs', async () => {
    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });
    fireEvent.click(summaryBtn);
    const currentInput = await screen.findByLabelText(/dashboard\.currentPassword/i);
    const newInput = screen.getByLabelText('newPassword');
    const confirmInput = screen.getByLabelText('confirmPassword');
    expect(currentInput).toBeInTheDocument();
    expect(newInput).toBeInTheDocument();
    expect(confirmInput).toBeInTheDocument();
  });

  it('affiche erreur currentPasswordRequired si currentPassword vide au submit', async () => {
    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });
    fireEvent.click(summaryBtn);

    const currentInput = await screen.findByLabelText(/dashboard\.currentPassword/i);
    const newInput = screen.getByLabelText('newPassword');
    const confirmInput = screen.getByLabelText('confirmPassword');
    // Remplir newPassword/confirm pour que seule la validation sur current échoue
    fireEvent.change(newInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });
    // Blur sur current vide pour déclencher validation
    fireEvent.blur(currentInput);

    // Obtenir le formulaire parent
    const form = currentInput.closest('form');
    expect(form).toBeTruthy();

    // Soumettre manuellement le formulaire
    fireEvent.submit(form!);

    // Attendre message d'erreur lié au current vide ou invalid
    await screen.findByText(/errors\.currentPasswordRequired/i);
  });

  it('affiche erreur passwordNotStrong si newPassword faible (submit manuelle)', async () => {
    // isStrongPassword retourne false
    (validationUtils.isStrongPassword as Mock).mockReturnValue(false);

    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });
    fireEvent.click(summaryBtn);

    const currentInput = await screen.findByLabelText(/dashboard\.currentPassword/i);
    const newInput = screen.getByLabelText('newPassword');
    const confirmInput = screen.getByLabelText('confirmPassword');

    // current non vide pour bypass currentPasswordError
    fireEvent.change(currentInput, { target: { value: 'Current123!' } });
    // new faible, confirm même valeur pour isoler la force du mot de passe
    fireEvent.change(newInput, { target: { value: 'weak' } });
    fireEvent.change(confirmInput, { target: { value: 'weak' } });
    fireEvent.blur(newInput);

    // Le bouton Save est désactivé, mais on soumet manuellement
    const form = currentInput.closest('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form!);

    // Attendre que handleSubmit affiche l'erreur passwordNotStrong
    await screen.findByText(/errors\.passwordNotStrong/i);
  });

  it('affiche erreur passwordsDontMatch si newPassword et confirmPassword ne correspondent pas (submit manuelle)', async () => {
    // isStrongPassword true
    (validationUtils.isStrongPassword as Mock).mockReturnValue(true);

    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });
    fireEvent.click(summaryBtn);

    const currentInput = await screen.findByLabelText(/dashboard\.currentPassword/i);
    const newInput = screen.getByLabelText('newPassword');
    const confirmInput = screen.getByLabelText('confirmPassword');

    // current non vide
    fireEvent.change(currentInput, { target: { value: 'Current123!' } });
    // new fort, confirm différent
    fireEvent.change(newInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'OtherPass456!' } });
    fireEvent.blur(confirmInput);

    // Soumettre manuellement
    const form = currentInput.closest('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form!);

    // Attendre que handleSubmit affiche l'erreur passwordsDontMatch
    await screen.findByText(/errors\.passwordsDontMatch/i);
  });

  it('redirige vers login si token manquant après validations', async () => {
    // Mock token null
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: any) => any) => {
      return selector({ authToken: null });
    });
    (validationUtils.isStrongPassword as Mock).mockReturnValue(true);

    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });
    fireEvent.click(summaryBtn);

    const currentInput = await screen.findByLabelText(/dashboard\.currentPassword/i);
    const newInput = screen.getByLabelText('newPassword');
    const confirmInput = screen.getByLabelText('confirmPassword');
    fireEvent.change(currentInput, { target: { value: 'Current123!' } });
    fireEvent.change(newInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

    // Soumettre manuellement
    const form = currentInput.closest('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('updateUserPassword succès status 200 : affiche successMsg', async () => {
    (validationUtils.isStrongPassword as Mock).mockReturnValue(true);
    vi.spyOn(userService, 'updateUserPassword').mockResolvedValue({ status: 200 } as any);

    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });
    fireEvent.click(summaryBtn);

    const currentInput = await screen.findByLabelText(/dashboard\.currentPassword/i);
    const newInput = screen.getByLabelText('newPassword');
    const confirmInput = screen.getByLabelText('confirmPassword');
    fireEvent.change(currentInput, { target: { value: 'Current123!' } });
    fireEvent.change(newInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

    const form = currentInput.closest('form')!;
    fireEvent.submit(form);

    await screen.findByText(/dashboard\.successMessagePasswordUpdate/i);
  });

  it('updateUserPassword échec status non 200 : affiche errors.passwordUpdate', async () => {
    (validationUtils.isStrongPassword as Mock).mockReturnValue(true);
    vi.spyOn(userService, 'updateUserPassword').mockResolvedValue({ status: 500 } as any);

    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });
    fireEvent.click(summaryBtn);

    const currentInput = await screen.findByLabelText(/dashboard\.currentPassword/i);
    const newInput = screen.getByLabelText('newPassword');
    const confirmInput = screen.getByLabelText('confirmPassword');
    fireEvent.change(currentInput, { target: { value: 'Current123!' } });
    fireEvent.change(newInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

    const form = currentInput.closest('form')!;
    fireEvent.submit(form);

    await screen.findByText(/errors\.passwordUpdate/i);
  });

  it('updateUserPassword axios error avec code : affiche getErrorMessage(code)', async () => {
    (validationUtils.isStrongPassword as Mock).mockReturnValue(true);
    const axiosError = { isAxiosError: true, response: { data: { code: 'my_code' } } };
    vi.spyOn(userService, 'updateUserPassword').mockRejectedValue(axiosError);

    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });
    fireEvent.click(summaryBtn);

    const currentInput = await screen.findByLabelText(/dashboard\.currentPassword/i);
    const newInput = screen.getByLabelText('newPassword');
    const confirmInput = screen.getByLabelText('confirmPassword');
    fireEvent.change(currentInput, { target: { value: 'Current123!' } });
    fireEvent.change(newInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

    const form = currentInput.closest('form')!;
    fireEvent.submit(form);

    await screen.findByText(/Error: my_code/i);
  });

  it('updateUserPassword axios error sans code : affiche generic_error', async () => {
    (validationUtils.isStrongPassword as Mock).mockReturnValue(true);
    const axiosErrorNoCode = { isAxiosError: true, response: { data: {} } };
    vi.spyOn(userService, 'updateUserPassword').mockRejectedValue(axiosErrorNoCode);

    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });
    fireEvent.click(summaryBtn);

    const currentInput = await screen.findByLabelText(/dashboard\.currentPassword/i);
    const newInput = screen.getByLabelText('newPassword');
    const confirmInput = screen.getByLabelText('confirmPassword');
    fireEvent.change(currentInput, { target: { value: 'Current123!' } });
    fireEvent.change(newInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

    const form = currentInput.closest('form')!;
    fireEvent.submit(form);

    await screen.findByText(/Error: generic_error/i);
  });

  it('updateUserPassword erreur réseau : affiche network_error', async () => {
    (validationUtils.isStrongPassword as Mock).mockReturnValue(true);
    vi.spyOn(userService, 'updateUserPassword').mockRejectedValue(new Error('Network failure'));

    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });
    fireEvent.click(summaryBtn);

    const currentInput = await screen.findByLabelText(/dashboard\.currentPassword/i);
    const newInput = screen.getByLabelText('newPassword');
    const confirmInput = screen.getByLabelText('confirmPassword');
    fireEvent.change(currentInput, { target: { value: 'Current123!' } });
    fireEvent.change(newInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

    const form = currentInput.closest('form')!;
    fireEvent.submit(form);

    await screen.findByText(/Error: network_error/i);
  });

  it('cancel réinitialise tous les champs et messages', async () => {
    (validationUtils.isStrongPassword as Mock).mockReturnValue(true);

    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });
    fireEvent.click(summaryBtn);

    const currentInput = await screen.findByLabelText(/dashboard\.currentPassword/i);
    const newInput = screen.getByLabelText('newPassword');
    const confirmInput = screen.getByLabelText('confirmPassword');

    // Modifier les valeurs
    fireEvent.change(currentInput, { target: { value: 'Current123!' } });
    fireEvent.change(newInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

    // Forcer une erreur (current vide)
    fireEvent.change(currentInput, { target: { value: '' } });
    fireEvent.blur(currentInput);
    // Remplir new+confirm pour activer... puis soumettre
    fireEvent.change(newInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });
    const form = currentInput.closest('form')!;
    fireEvent.submit(form);
    await screen.findByText(/errors\.passwordInvalid/i);

    // Cliquer sur Cancel
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.cancel/i }));
    // Champs remis à vide
    const currentAfter = screen.getByLabelText(/dashboard\.currentPassword/i) as HTMLInputElement;
    const newAfter = screen.getByLabelText('newPassword') as HTMLInputElement;
    const confirmAfter = screen.getByLabelText('confirmPassword') as HTMLInputElement;
    expect(currentAfter.value).toBe('');
    expect(newAfter.value).toBe('');
    expect(confirmAfter.value).toBe('');
    // Aucun message d’erreur ou succès visible
    expect(screen.queryByText(/errors\.currentPasswordRequired/i)).toBeNull();
    expect(screen.queryByText(/dashboard\.successMessagePasswordUpdate/i)).toBeNull();
  });

  it('réinitialise messages lors de la fermeture de l’accordéon', async () => {
    (validationUtils.isStrongPassword as Mock).mockReturnValue(true);

    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });

    // 1) Ouvrir et provoquer une erreur
    fireEvent.click(summaryBtn);
    const currentInput1 = await screen.findByLabelText(/dashboard\.currentPassword/i);
    const newInput1 = screen.getByLabelText('newPassword');
    const confirmInput1 = screen.getByLabelText('confirmPassword');
    fireEvent.change(newInput1, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmInput1, { target: { value: 'StrongPass123!' } });
    fireEvent.blur(currentInput1);
    const form1 = currentInput1.closest('form')!;
    fireEvent.submit(form1);
    // On attend message d'erreur currentPasswordRequired ou passwordInvalid
    await screen.findByText(/errors\.currentPasswordRequired/i);

    // 2) Fermer
    fireEvent.click(summaryBtn);

    // 3) Rouvrir et vérifier qu'aucun message n'est présent
    fireEvent.click(summaryBtn);
    const currentInput2 = await screen.findByLabelText(/dashboard\.currentPassword/i);
    expect((currentInput2 as HTMLInputElement).value).toBe('');
    expect(screen.queryByText(/errors\.currentPasswordRequired/i)).toBeNull();
    expect(screen.queryByText(/dashboard\.successMessagePasswordUpdate/i)).toBeNull();
  });

  it('toggle show/hide password current field', async () => {
    renderWithRouter(<PasswordSection />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.password/i });
    fireEvent.click(summaryBtn);
    const currentInput = await screen.findByLabelText(/dashboard\.currentPassword/i);
    expect(currentInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByLabelText('dashboard.showPassword');
    fireEvent.click(toggleBtn);
    expect(currentInput).toHaveAttribute('type', 'text');

    const toggleBtn2 = screen.getByLabelText('dashboard.hidePassword');
    fireEvent.click(toggleBtn2);
    expect(currentInput).toHaveAttribute('type', 'password');
  });
});

