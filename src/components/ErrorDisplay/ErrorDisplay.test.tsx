/// <reference types="vitest" />

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { JSX } from 'react';
// On importe normalement le composant
import { ErrorDisplay } from './ErrorDisplay';

// Factory pour stocker le navigate mock
let navigateMock = vi.fn();

// Mock global de react-router-dom useNavigate, avant tout test
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('<ErrorDisplay />', () => {
  const title = 'Erreur inattendue';
  const message = 'Une erreur est survenue, veuillez réessayer plus tard.';
  const retryText = 'Réessayer';
  const homeText = 'Accueil';

  function renderWithRouter(ui: JSX.Element) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  }

  beforeEach(() => {
    // Réinitialiser navigateMock avant chaque test
    navigateMock = vi.fn();
  });

  it('rend le titre, le message et les deux boutons par défaut', () => {
    renderWithRouter(
      <ErrorDisplay
        title={title}
        message={message}
        retryButtonText={retryText}
        homeButtonText={homeText}
      />
    );

    expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent(title);
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: retryText })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: homeText })).toBeInTheDocument();
  });

  it('cache le bouton retry si showRetry=false mais affiche toujours le bouton home', () => {
    renderWithRouter(
      <ErrorDisplay
        title={title}
        message={message}
        retryButtonText={retryText}
        homeButtonText={homeText}
        showRetry={false}
      />
    );

    expect(screen.queryByRole('button', { name: retryText })).toBeNull();
    expect(screen.getByRole('button', { name: homeText })).toBeInTheDocument();
  });

  it('appelle onRetry quand on clique sur Retry', () => {
    const onRetry = vi.fn();
    renderWithRouter(
      <ErrorDisplay
        title={title}
        message={message}
        retryButtonText={retryText}
        onRetry={onRetry}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: retryText }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('ne fait rien (ne plante pas) quand on clique sur Retry sans onRetry défini', () => {
    // Pas de prop onRetry, mais on fournit retryButtonText pour que le bouton soit rendu
    renderWithRouter(
      <ErrorDisplay
        title={title}
        message={message}
        retryButtonText={retryText}
      />
    );

    const retryButton = screen.getByRole('button', { name: retryText });
    expect(() => {
      fireEvent.click(retryButton);
    }).not.toThrow();

    // Vérifier que le bouton est toujours là après clic
    expect(screen.getByRole('button', { name: retryText })).toBeInTheDocument();
  });

  describe('bouton Home', () => {
    it('navigue vers "/" quand on clique sur Home', () => {
      renderWithRouter(
        <ErrorDisplay
          title={title}
          message={message}
          homeButtonText={homeText}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: homeText }));
      expect(navigateMock).toHaveBeenCalledWith('/');
    });

    it('cache le bouton home si showHome=false', () => {
      renderWithRouter(
        <ErrorDisplay
          title={title}
          message={message}
          retryButtonText={retryText}
          homeButtonText={homeText}
          showHome={false}
        />
      );
      expect(screen.queryByRole('button', { name: homeText })).toBeNull();
      // Le bouton Retry reste visible si showRetry=true par défaut
      expect(screen.getByRole('button', { name: retryText })).toBeInTheDocument();
    });
  });
});
