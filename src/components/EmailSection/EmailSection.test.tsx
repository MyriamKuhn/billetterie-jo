/// <reference types="vitest" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailSection } from './EmailSection';
import { vi, type Mock } from 'vitest';
import * as userService from '../../services/userService';
import * as errorUtils from '../../utils/errorUtils';
import { useAuthStore } from '../../stores/useAuthStore';
import { useLanguageStore } from '../../stores/useLanguageStore';

// Factory pour stocker le navigate mock
let navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Zustand stores
vi.mock('../../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('../../stores/useLanguageStore', () => ({
  useLanguageStore: vi.fn(),
}));

// Mock errorUtils
vi.spyOn(errorUtils, 'getErrorMessage').mockImplementation((_t, code) => `Error: ${code}`);

describe('<EmailSection />', () => {
  const currentEmail = 'current@example.com';
  const onUpdate = vi.fn();
  const token = 'fake-token';
  const lang = 'en';

  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock = vi.fn();

    // Mock useAuthStore comme sélecteur Zustand
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: any) => any) => {
      return selector({ authToken: token });
    });
    // Mock useLanguageStore de même
    (useLanguageStore as unknown as Mock).mockImplementation((selector: (state: any) => any) => {
      return selector({ lang });
    });
  });

  it('affiche les infos de base', () => {
    render(<EmailSection currentEmail={currentEmail} onUpdate={onUpdate} />);
    expect(screen.getAllByText('dashboard.email').length).toBeGreaterThan(0);
    expect(screen.getByText(currentEmail)).toBeInTheDocument();
  });

  it('ouvre et ferme l’accordéon', async () => {
    render(<EmailSection currentEmail={currentEmail} onUpdate={onUpdate} />);
    const summary = screen.getByRole('button', { name: /dashboard\.email/i });
    fireEvent.click(summary);
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeVisible();
    });

    fireEvent.click(summary);
    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  it('redirige vers login si pas de token', async () => {
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: any) => any) => {
      return selector({ authToken: null });
    });

    render(<EmailSection currentEmail={currentEmail} onUpdate={onUpdate} />);
    const summary = screen.getByRole('button', { name: /dashboard\.email/i });
    fireEvent.click(summary);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    const saveButton = screen.getByRole('button', { name: 'dashboard.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('update email avec succès (204)', async () => {
    vi.spyOn(userService, 'updateUserEmail').mockResolvedValue({ status: 204 } as any);
    render(<EmailSection currentEmail={currentEmail} onUpdate={onUpdate} />);

    const summary = screen.getByRole('button', { name: /dashboard\.email/i });
    fireEvent.click(summary);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new@example.com' } });

    const saveButton = screen.getByRole('button', { name: 'dashboard.save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(userService.updateUserEmail).toHaveBeenCalledWith(token, 'new@example.com', lang);
      expect(onUpdate).toHaveBeenCalledWith('new@example.com');
      expect(screen.getByText('dashboard.successMessageEmailUpdate')).toBeInTheDocument();
    });
  });

  it('affiche une erreur générique si échec update', async () => {
    vi.spyOn(userService, 'updateUserEmail').mockResolvedValue({ status: 500 } as any);
    render(<EmailSection currentEmail={currentEmail} onUpdate={onUpdate} />);

    const summary = screen.getByRole('button', { name: /dashboard\.email/i });
    fireEvent.click(summary);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'dashboard.save' }));

    await waitFor(() => {
      expect(screen.getByText('errors.emailUpdate')).toBeInTheDocument();
    });
  });

  it('affiche une erreur Axios avec code', async () => {
    const axiosError = { isAxiosError: true, response: { data: { code: 'my_code' } } };
    vi.spyOn(userService, 'updateUserEmail').mockRejectedValue(axiosError);

    render(<EmailSection currentEmail={currentEmail} onUpdate={onUpdate} />);
    const summary = screen.getByRole('button', { name: /dashboard\.email/i });
    fireEvent.click(summary);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'dashboard.save' }));

    await waitFor(() => {
      expect(screen.getByText('Error: my_code')).toBeInTheDocument();
    });
  });

  it('affiche une erreur réseau en cas d’erreur inconnue', async () => {
    vi.spyOn(userService, 'updateUserEmail').mockRejectedValue(new Error('Network error'));
    render(<EmailSection currentEmail={currentEmail} onUpdate={onUpdate} />);

    const summary = screen.getByRole('button', { name: /dashboard\.email/i });
    fireEvent.click(summary);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'dashboard.save' }));

    await waitFor(() => {
      expect(screen.getByText('Error: network_error')).toBeInTheDocument();
    });
  });

  it('réinitialise le formulaire avec Annuler', () => {
    render(<EmailSection currentEmail={currentEmail} onUpdate={onUpdate} />);
    const summary = screen.getByRole('button', { name: /dashboard\.email/i });
    fireEvent.click(summary);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'dashboard.cancel' }));

    expect(input).toHaveValue(currentEmail);
  });

  // ---------------------------
  // Tests supplémentaires pour couvrir les branches manquantes
  // ---------------------------

  it('affiche une erreur si email invalide (isEmailValid false)', async () => {
    render(<EmailSection currentEmail={currentEmail} onUpdate={onUpdate} />);
    const summary = screen.getByRole('button', { name: /dashboard\.email/i });
    fireEvent.click(summary);

    const input = screen.getByRole('textbox');
    // Mettre une valeur invalide
    fireEvent.change(input, { target: { value: 'invalid-email' } });
    // Simuler le blur pour set newEmailTouched = true et afficher helperText
    fireEvent.blur(input);
    // Vérifier que le helperText d'erreur de validation apparaît
    await waitFor(() => {
      expect(screen.getByText('errors.emailInvalid')).toBeInTheDocument();
    });

    // Récupérer le form parent pour déclencher handleSubmit malgré le bouton désactivé
    const form = input.closest('form')!;
    fireEvent.submit(form);

    // Comme isEmailValid(newEmail) est false, on doit voir l'erreur 'errors.emailRequired'
    await waitFor(() => {
      expect(screen.getByText('errors.emailRequired')).toBeInTheDocument();
    });
  });

  it('affiche une erreur si email identique à l’original', async () => {
    render(<EmailSection currentEmail={currentEmail} onUpdate={onUpdate} />);
    const summary = screen.getByRole('button', { name: /dashboard\.email/i });
    fireEvent.click(summary);

    const input = screen.getByRole('textbox');
    // Ne pas changer la valeur : reste currentEmail
    expect(input).toHaveValue(currentEmail);

    // Soumettre le formulaire
    const form = input.closest('form')!;
    fireEvent.submit(form);

    // Comme newEmail === currentEmail, on doit voir l'erreur 'errors.emailUnchanged'
    await waitFor(() => {
      expect(screen.getByText('errors.emailUnchanged')).toBeInTheDocument();
    });
  });

  it('affiche une erreur générique via getErrorMessage generic_error', async () => {
    // Simuler une erreur Axios avec response.data sans code
    const axiosErrorNoCode = { isAxiosError: true, response: { data: {} } };
    vi.spyOn(userService, 'updateUserEmail').mockRejectedValue(axiosErrorNoCode);

    render(<EmailSection currentEmail={currentEmail} onUpdate={onUpdate} />);
    const summary = screen.getByRole('button', { name: /dashboard\.email/i });
    fireEvent.click(summary);

    const input = screen.getByRole('textbox');
    // Changer pour une nouvelle adresse valide
    fireEvent.change(input, { target: { value: 'valid@example.com' } });

    // Soumettre
    const saveButton = screen.getByRole('button', { name: 'dashboard.save' });
    fireEvent.click(saveButton);

    // On s'attend à l'appel, puis à l'affichage de l'erreur générique via getErrorMessage(t, 'generic_error')
    await waitFor(() => {
      expect(userService.updateUserEmail).toHaveBeenCalledWith(token, 'valid@example.com', lang);
      expect(screen.getByText('Error: generic_error')).toBeInTheDocument();
    });
  });

  it('helperText disparaît ou s’actualise après correction de l’email invalide', async () => {
    render(<EmailSection currentEmail={currentEmail} onUpdate={onUpdate} />);
    const summary = screen.getByRole('button', { name: /dashboard\.email/i });
    fireEvent.click(summary);

    const input = screen.getByRole('textbox');
    // Entrer email invalide, blur
    fireEvent.change(input, { target: { value: 'bad' } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.getByText('errors.emailInvalid')).toBeInTheDocument();
    });

    // Corriger en email valide
    fireEvent.change(input, { target: { value: 'good@example.com' } });
    // Sur le champ blur n'est pas forcément nécessaire ici, mais on peut blur à nouveau
    fireEvent.blur(input);
    // Le helperText d'erreur invalide ne doit plus apparaître
    await waitFor(() => {
      expect(screen.queryByText('errors.emailInvalid')).not.toBeInTheDocument();
    });
  });
});
