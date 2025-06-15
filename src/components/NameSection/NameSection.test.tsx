/// <reference types="vitest" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { JSX } from 'react';

// Mock de useTranslation pour que t(key) retourne key
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock de Zustand store useAuthStore
import { useAuthStore } from '../../stores/useAuthStore';
vi.mock('../../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock de useNavigate de react-router-dom
let navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Mock de updateUserProfile
import * as userService from '../../services/userService';

// Mock de getErrorMessage
import * as errorUtils from '../../utils/errorUtils';
vi.spyOn(errorUtils, 'getErrorMessage').mockImplementation((_t, code) => `Error: ${code}`);

// Importer le composant après mocks
import { NameSection } from './NameSection';
import type { UserProfile } from '../../pages/UserDashboardPage';

describe('<NameSection />', () => {
  // Objet user par défaut. Satisfaire l’interface UserProfile au besoin (cast as).
  const defaultUser: UserProfile = {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john.doe@example.com',
    twoFAEnabled: false,
    // Si d’autres champs obligatoires existent, ajoutez-les ici ou usez as UserProfile
  } as UserProfile;

  const onUpdate = vi.fn();
  const token = 'fake-token';

  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock = vi.fn();
    // Mock useAuthStore pour retourner un token valide
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: any) => any) => {
      return selector({ authToken: token });
    });
  });

  // Utilitaire pour rendre avec router
  function renderWithRouter(ui: JSX.Element) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  }

  it('affiche le titre et le nom complet dans l’AccordionSummary', () => {
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    // Titre t('dashboard.name') et résumé "John Doe"
    expect(screen.getByText('dashboard.name')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('ouvre l’accordéon et affiche les champs firstname et lastname', async () => {
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.name/i });

    fireEvent.click(summaryBtn);

    // Attendre que les champs apparaissent
    const firstnameInput = await screen.findByLabelText(/dashboard\.firstname/i);
    const lastnameInput = await screen.findByLabelText(/dashboard\.lastname/i);
    expect(firstnameInput).toBeInTheDocument();
    expect(lastnameInput).toBeInTheDocument();
  });

  it('affiche helperText et erreur si lastname vide après blur', async () => {
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.name/i }));
    const lastnameInput = await screen.findByLabelText(/dashboard\.lastname/i);
    fireEvent.change(lastnameInput, { target: { value: '' } });
    fireEvent.blur(lastnameInput);
    // Attendre l’apparition du helperText d’erreur
    await screen.findByText('errors.lastnameRequired');
  });

  it('affiche helperText et erreur si firstname vide après blur', async () => {
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.name/i }));
    const firstnameInput = await screen.findByLabelText(/dashboard\.firstname/i);
    fireEvent.change(firstnameInput, { target: { value: '' } });
    fireEvent.blur(firstnameInput);
    await screen.findByText('errors.firstnameRequired');
  });

  it('affiche erreur errors.nameRequired si un champ vide au submit', async () => {
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.name/i }));
    const firstnameInput = await screen.findByLabelText(/dashboard\.firstname/i);
    const lastnameInput = await screen.findByLabelText(/dashboard\.lastname/i);

    // Vider firstname, puis soumettre
    fireEvent.change(firstnameInput, { target: { value: '' } });
    fireEvent.blur(firstnameInput);
    fireEvent.submit(firstnameInput.closest('form')!);
    await screen.findByText('errors.nameRequired');

    // Rétablir firstname, vider lastname, puis soumettre
    fireEvent.change(firstnameInput, { target: { value: 'Jane' } });
    fireEvent.change(lastnameInput, { target: { value: '' } });
    fireEvent.blur(lastnameInput);
    fireEvent.submit(lastnameInput.closest('form')!);
    await screen.findByText('errors.nameRequired');
  });

  it('redirige vers login si token manquant', async () => {
    // Mock token null
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: any) => any) => {
      return selector({ authToken: null });
    });
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.name/i }));
    const firstnameInput = await screen.findByLabelText(/dashboard\.firstname/i);
    const lastnameInput = await screen.findByLabelText(/dashboard\.lastname/i);
    fireEvent.change(firstnameInput, { target: { value: 'Jane' } });
    fireEvent.change(lastnameInput, { target: { value: 'Smith' } });
    fireEvent.submit(firstnameInput.closest('form')!);
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('updateUserProfile succès status 204 : affiche successMsg et appelle onUpdate', async () => {
    vi.spyOn(userService, 'updateUserProfile').mockResolvedValue({ status: 204 } as any);
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.name/i }));
    const firstnameInput = await screen.findByLabelText(/dashboard\.firstname/i);
    const lastnameInput = await screen.findByLabelText(/dashboard\.lastname/i);
    fireEvent.change(firstnameInput, { target: { value: 'Jane' } });
    fireEvent.change(lastnameInput, { target: { value: 'Smith' } });
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.save/i }));
    await waitFor(() => {
      expect(userService.updateUserProfile).toHaveBeenCalledWith(token, { firstname: 'Jane', lastname: 'Smith' });
      expect(onUpdate).toHaveBeenCalledWith({ firstname: 'Jane', lastname: 'Smith' });
      expect(screen.getByText('dashboard.successMessageProfileUpdate')).toBeInTheDocument();
    });
  });

  it('updateUserProfile succès status 200 : affiche successMsg et appelle onUpdate', async () => {
    vi.spyOn(userService, 'updateUserProfile').mockResolvedValue({ status: 200 } as any);
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.name/i }));
    const firstnameInput = await screen.findByLabelText(/dashboard\.firstname/i);
    const lastnameInput = await screen.findByLabelText(/dashboard\.lastname/i);
    fireEvent.change(firstnameInput, { target: { value: 'Alice' } });
    fireEvent.change(lastnameInput, { target: { value: 'Wonder' } });
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.save/i }));
    await waitFor(() => {
      expect(userService.updateUserProfile).toHaveBeenCalledWith(token, { firstname: 'Alice', lastname: 'Wonder' });
      expect(onUpdate).toHaveBeenCalledWith({ firstname: 'Alice', lastname: 'Wonder' });
      expect(screen.getByText('dashboard.successMessageProfileUpdate')).toBeInTheDocument();
    });
  });

  it('updateUserProfile échec status non 200/204 : affiche errors.nameUpdate', async () => {
    vi.spyOn(userService, 'updateUserProfile').mockResolvedValue({ status: 500 } as any);
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.name/i }));
    const firstnameInput = await screen.findByLabelText(/dashboard\.firstname/i);
    const lastnameInput = await screen.findByLabelText(/dashboard\.lastname/i);
    fireEvent.change(firstnameInput, { target: { value: 'Bob' } });
    fireEvent.change(lastnameInput, { target: { value: 'Marley' } });
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.save/i }));
    await screen.findByText('errors.nameUpdate');
  });

  it('updateUserProfile axios error avec code : affiche getErrorMessage(code)', async () => {
    const axiosError = { isAxiosError: true, response: { data: { code: 'my_code' } } };
    vi.spyOn(userService, 'updateUserProfile').mockRejectedValue(axiosError);
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.name/i }));
    const firstnameInput = await screen.findByLabelText(/dashboard\.firstname/i);
    const lastnameInput = await screen.findByLabelText(/dashboard\.lastname/i);
    fireEvent.change(firstnameInput, { target: { value: 'Carl' } });
    fireEvent.change(lastnameInput, { target: { value: 'Sagan' } });
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.save/i }));
    await screen.findByText('Error: my_code');
  });

  it('updateUserProfile axios error sans code : affiche generic_error', async () => {
    const axiosErrorNoCode = { isAxiosError: true, response: { data: {} } };
    vi.spyOn(userService, 'updateUserProfile').mockRejectedValue(axiosErrorNoCode);
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.name/i }));
    const firstnameInput = await screen.findByLabelText(/dashboard\.firstname/i);
    const lastnameInput = await screen.findByLabelText(/dashboard\.lastname/i);
    fireEvent.change(firstnameInput, { target: { value: 'Carl' } });
    fireEvent.change(lastnameInput, { target: { value: 'Sagan' } });
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.save/i }));
    await screen.findByText('Error: generic_error');
  });

  it('updateUserProfile erreur réseau : affiche network_error', async () => {
    vi.spyOn(userService, 'updateUserProfile').mockRejectedValue(new Error('Network failure'));
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.name/i }));
    const firstnameInput = await screen.findByLabelText(/dashboard\.firstname/i);
    const lastnameInput = await screen.findByLabelText(/dashboard\.lastname/i);
    fireEvent.change(firstnameInput, { target: { value: 'Neil' } });
    fireEvent.change(lastnameInput, { target: { value: 'Armstrong' } });
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.save/i }));
    await screen.findByText('Error: network_error');
  });

  it('cancel réinitialise les champs et efface messages', async () => {
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.name/i }));
    const firstnameInput = await screen.findByLabelText(/dashboard\.firstname/i);
    const lastnameInput = await screen.findByLabelText(/dashboard\.lastname/i);

    // Modifier temporairement
    fireEvent.change(firstnameInput, { target: { value: 'Temp' } });
    fireEvent.change(lastnameInput, { target: { value: 'User' } });

    // Forcer une erreur sur firstname
    fireEvent.change(firstnameInput, { target: { value: '' } });
    fireEvent.blur(firstnameInput);
    // Attendre mise à jour DOM
    await screen.findByLabelText(/dashboard\.firstname/i);

    // Cliquer sur Cancel
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.cancel/i }));
    // Vérifier que les valeurs sont revenues à l’original
    const f2 = screen.getByLabelText(/dashboard\.firstname/i) as HTMLInputElement;
    const l2 = screen.getByLabelText(/dashboard\.lastname/i) as HTMLInputElement;
    expect(f2.value).toBe('John');
    expect(l2.value).toBe('Doe');
    // Aucun message d’erreur ou de succès
    expect(screen.queryByText('errors.nameRequired')).toBeNull();
    expect(screen.queryByText('dashboard.successMessageProfileUpdate')).toBeNull();
  });

  it('helperText disparaît après correction des champs vides', async () => {
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard\.name/i }));
    const firstnameInput = await screen.findByLabelText(/dashboard\.firstname/i);
    const lastnameInput = await screen.findByLabelText(/dashboard\.lastname/i);

    // Vider + blur firstname => erreur
    fireEvent.change(firstnameInput, { target: { value: '' } });
    fireEvent.blur(firstnameInput);
    await screen.findByText('errors.firstnameRequired');

    // Corriger firstname => l’erreur disparaît
    fireEvent.change(firstnameInput, { target: { value: 'ValidName' } });
    fireEvent.blur(firstnameInput);
    await waitFor(() => {
      expect(screen.queryByText('errors.firstnameRequired')).toBeNull();
    });

    // Vider + blur lastname => erreur
    fireEvent.change(lastnameInput, { target: { value: '' } });
    fireEvent.blur(lastnameInput);
    await screen.findByText('errors.lastnameRequired');

    // Corriger lastname => l’erreur disparaît
    fireEvent.change(lastnameInput, { target: { value: 'ValidLast' } });
    fireEvent.blur(lastnameInput);
    await waitFor(() => {
      expect(screen.queryByText('errors.lastnameRequired')).toBeNull();
    });
  });

  it('réinitialise champs et messages lors de la fermeture de l’accordéon', async () => {
    renderWithRouter(<NameSection user={defaultUser} onUpdate={onUpdate} />);
    const summaryBtn = screen.getByRole('button', { name: /dashboard\.name/i });

    // 1. Ouvrir
    fireEvent.click(summaryBtn);
    const firstnameInput = await screen.findByLabelText(/dashboard\.firstname/i);
    const lastnameInput = await screen.findByLabelText(/dashboard\.lastname/i);

    // 2. Modifier firstname et lastname
    fireEvent.change(firstnameInput, { target: { value: 'TempFirst' } });
    fireEvent.change(lastnameInput, { target: { value: 'TempLast' } });

    // 3. Forcer un message d’erreur via submit (firstname vide) pour avoir errorMsg
    fireEvent.change(firstnameInput, { target: { value: '' } });
    fireEvent.blur(firstnameInput);
    fireEvent.submit(firstnameInput.closest('form')!);
    // Vérifier qu’on a bien errorMsg
    await screen.findByText('errors.nameRequired');

    // 4. Fermer l’accordéon => handleAccordionChange détecte expanded=true et réinitialise
    fireEvent.click(summaryBtn);
    // Après fermeture, les inputs ne sont plus visibles. On rouvre pour vérifier l’état réinitialisé.
    fireEvent.click(summaryBtn);

    // 5. Vérifier que firstname/lastname sont revenus à l’original et qu’aucun message d’erreur/succès
    const f2 = await screen.findByLabelText(/dashboard\.firstname/i) as HTMLInputElement;
    const l2 = await screen.findByLabelText(/dashboard\.lastname/i) as HTMLInputElement;
    expect(f2.value).toBe('John');
    expect(l2.value).toBe('Doe');
    expect(screen.queryByText('errors.nameRequired')).toBeNull();
    expect(screen.queryByText('dashboard.successMessageProfileUpdate')).toBeNull();
  });
});

