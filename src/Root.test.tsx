import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── MUI SHIMS ────────────────────────────────────────────────────────────────
// On stubbe ThemeProvider pour qu'il ne tente pas de lire le thème réel
vi.mock('@mui/material/styles', async () => {
  const actual = await vi.importActual<object>('@mui/material/styles');
  return {
    ...actual,
    ThemeProvider: ({ children }: any) => <>{children}</>,
  };
});
// On stubbe CssBaseline
vi.mock('@mui/material/CssBaseline', () => ({ default: () => null }));
// useMediaQuery sera contrôlé ci-dessous
vi.mock('@mui/material/useMediaQuery', () => ({ default: vi.fn() }));

// ── AUTRES SHIMS ─────────────────────────────────────────────────────────────
vi.mock('./stores/useLanguageStore', () => ({
  useLanguageStore: (sel: any) => sel({ lang: 'fr' }),
}));
vi.mock('./i18n', () => ({
  default: { language: 'fr', changeLanguage: vi.fn() },
}));
vi.mock('react-i18next', () => ({
  I18nextProvider: ({ children }: any) => <>{children}</>,
  Trans: ({ children }: any) => <>{children}</>,
  useTranslation: () => ({ t: (k: string) => k }),
}));
vi.mock('react-cookie-consent', () => ({
  default: (props: any) => (
    <div data-testid="cookie-banner">
      <button data-testid="accept-btn" onClick={props.onAccept}>
        {props.buttonText}
      </button>
      <button data-testid="decline-btn" onClick={props.onDecline}>
        {props.declineButtonText}
      </button>
      <div data-testid="cookie-children">{props.children}</div>
    </div>
  ),
}));
vi.mock('./App', () => ({
  default: (props: any) => (
    <div data-testid="app-mock">
      <span data-testid="mode">{props.mode}</span>
      <button data-testid="toggle-btn" onClick={props.toggleMode}>
        toggle
      </button>
    </div>
  ),
}));

// ── Helper pour monter <Root /> avec mocks configurés ────────────────────────
async function mountRoot(
  prefersDark: boolean,
  store: {
    mode: 'light' | 'dark';
    setDark: () => void;
    setLight: () => void;
    toggle: () => void;
  }
) {
  // Mock de la préférence système
  const useMediaQuery = (await import('@mui/material/useMediaQuery')).default as jest.Mock;
  useMediaQuery.mockReturnValue(prefersDark);

  // Mock du hook Zustand
  vi.doMock('./stores/useThemeStore', () => ({
    useThemeStore: (sel: any) => sel(store),
  }));

  // Import et rendu
  const { Root } = await import('./Root');
  render(<Root />);
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
});

// ── Tests ────────────────────────────────────────────────────────────────────
describe('Root – initial theme sync', () => {
  it('calls setDark() if prefersDarkMode=true and no persisted theme', async () => {
    const setDark = vi.fn();
    const setLight = vi.fn();
    await mountRoot(true, { mode: 'light', setDark, setLight, toggle: () => {} });

    await waitFor(() => {
      expect(setDark).toHaveBeenCalledOnce();
      expect(setLight).not.toHaveBeenCalled();
    });
  });

  it('calls setLight() if prefersDarkMode=false and no persisted theme', async () => {
    const setDark = vi.fn();
    const setLight = vi.fn();
    await mountRoot(false, { mode: 'light', setDark, setLight, toggle: () => {} });

    await waitFor(() => {
      expect(setLight).toHaveBeenCalledOnce();
      expect(setDark).not.toHaveBeenCalled();
    });
  });
});

describe('Root – toggle() is passed through to App', () => {
  it('calls toggle() when user clicks the toggle button', async () => {
    const toggle = vi.fn();
    await mountRoot(false, {
      mode: 'light',
      setDark: () => {},
      setLight: () => {},
      toggle,
    });

    // S'assure que le bouton existe
    await waitFor(() => screen.getByTestId('toggle-btn'));
    // Clique
    await userEvent.click(screen.getByTestId('toggle-btn'));
    expect(toggle).toHaveBeenCalledOnce();
  });
});

describe('Root – CookieConsent integration', () => {
  it('passes correct props and handles onAccept/onDecline', async () => {
    await mountRoot(false, {
      mode: 'light',
      setDark: () => {},
      setLight: () => {},
      toggle: () => {},
    });
    const logSpy = vi.spyOn(console, 'log');

    expect(screen.getByTestId('accept-btn')).toHaveTextContent('cookieBanner.accept');
    expect(screen.getByTestId('decline-btn')).toHaveTextContent('cookieBanner.decline');

    await userEvent.click(screen.getByTestId('accept-btn'));
    expect(logSpy).toHaveBeenCalledWith('Cookies acceptés');

    await userEvent.click(screen.getByTestId('decline-btn'));
    expect(logSpy).toHaveBeenCalledWith('Cookies refusés');
  });
});

describe('Root – respects persisted theme', () => {
  it('does not call setDark/setLight if theme-mode exists in localStorage', async () => {
    localStorage.setItem('theme-mode', JSON.stringify({ state: { mode: 'dark' }, version: 1 }));
    const setDark = vi.fn();
    const setLight = vi.fn();
    await mountRoot(true, { mode: 'light', setDark, setLight, toggle: () => {} });

    // early return => pas d’appel
    expect(setDark).not.toHaveBeenCalled();
    expect(setLight).not.toHaveBeenCalled();
  });
});
