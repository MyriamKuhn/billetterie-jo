import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorDisplay } from './ErrorDisplay';

describe('<ErrorDisplay />', () => {
  const title = 'Erreur inattendue';
  const message = 'Une erreur est survenue, veuillez réessayer plus tard.';
  const retryText = 'Réessayer';
  const homeText = 'Accueil';

  it('rend le titre, le message et les deux boutons par défaut', () => {
    render(
      <ErrorDisplay
        title={title}
        message={message}
        retryButtonText={retryText}
        homeButtonText={homeText}
      />
    );

    // Titre et message
    expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent(title);
    expect(screen.getByText(message)).toBeInTheDocument();

    // Boutons
    expect(screen.getByRole('button', { name: retryText })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: homeText })).toBeInTheDocument();
  });

  it('cache le bouton retry si showRetry=false mais affiche toujours le bouton home', () => {
    render(
      <ErrorDisplay
        title={title}
        message={message}
        retryButtonText={retryText}
        homeButtonText={homeText}      // <-- on le passe ici aussi
        showRetry={false}
      />
    );

    // Le bouton retry n'est plus rendu
    expect(screen.queryByRole('button', { name: retryText })).toBeNull();

    // Le bouton home reste bien présent
    expect(screen.getByRole('button', { name: homeText })).toBeInTheDocument();
  });

  it('appelle onRetry quand on clique sur Retry', () => {
    const onRetry = vi.fn();
    render(
      <ErrorDisplay
        title={title}
        message={message}
        retryButtonText={retryText}
        onRetry={onRetry}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: retryText }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  describe('bouton Home', () => {
    let originalLocation: Location;

    beforeEach(() => {
      // On stubbe window.location.href
      originalLocation = window.location;
      // @ts-ignore
      delete window.location;
      // @ts-ignore
      window.location = { href: '' };
    });
    afterEach(() => {
      // On restaure
      // @ts-ignore
      window.location = originalLocation;
    });

    it('navigue vers "/" quand on clique sur Home', () => {
      render(
        <ErrorDisplay
          title={title}
          message={message}
          homeButtonText={homeText}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: homeText }));
      expect(window.location.href).toBe('/');
    });
  });
});
