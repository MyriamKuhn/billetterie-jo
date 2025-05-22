import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1) On mocke react-router-dom AVANT tout import de App
vi.mock('react-router-dom', () => {
  return {
    __esModule: true,
    BrowserRouter: ({ children }: any) => <>{children}</>,
    Routes:        ({ children }: any) => <>{children}</>,
    Route:         ({ element }: any)   => element,
  };
});

// 2) On stubbe Navbar et les pages pour alléger le test
vi.mock('./components/Navbar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar" />,
}));
vi.mock('./pages/HomePage',    () => ({ __esModule: true, default: () => <div>HomePage</div> }));
vi.mock('./pages/TicketsPage', () => ({ __esModule: true, default: () => <div>TicketsPage</div> }));

// 3) On mocke i18n (default export)
vi.mock('./i18n', () => ({
  __esModule: true,
  default: {
    language: 'en',
    changeLanguage: vi.fn(),
  },
}));

// 4) On mocke useLanguageStore pour qu’il applique le sélecteur sur un état factice
vi.mock('./stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: vi.fn(),
}));

// ——— Maintenant les imports « réels » ———
import App from './App';
import i18n from './i18n';
import { useLanguageStore } from './stores/useLanguageStore';

const useLanguageStoreMock = vi.mocked(useLanguageStore);
const changeLanguageMock = (i18n.changeLanguage as unknown) as ReturnType<typeof vi.fn>;

describe('App', () => {
  beforeEach(() => {
    // À chaque test, on réimplémente le hook pour qu’il retourne 'fr'
    useLanguageStoreMock.mockReset();
    useLanguageStoreMock.mockImplementation((selector: any) =>
      // selector reçoit l'état, on lui passe { lang: 'fr' }
      selector({ lang: 'fr' })
    );

    // On réinitialise le spy i18n
    changeLanguageMock.mockReset();

    // On nettoie l'attribut lang HTML pour l'isoler
    document.documentElement.lang = '';
  });

  it('initialise <html lang> à la langue du store', () => {
    render(<App mode="light" toggleMode={() => {}} />);
    expect(document.documentElement.lang).toBe('fr');
  });

  it('appelle i18n.changeLanguage si nécessaire', () => {
    render(<App mode="light" toggleMode={() => {}} />);
    expect(changeLanguageMock).toHaveBeenCalledWith('fr');
  });

  it('rend la Navbar et les routes moquées', () => {
    const { getByTestId, getByText } = render(
      <App mode="dark" toggleMode={() => {}} />
    );
    expect(getByTestId('navbar')).toBeInTheDocument();
    expect(getByText('HomePage')).toBeInTheDocument();
    expect(getByText('TicketsPage')).toBeInTheDocument();
  });

  it('n’appelle pas i18n.changeLanguage si la langue correspond déjà', () => {
    // on fait que le store retourne 'en'
    useLanguageStoreMock.mockImplementation((selector: any) =>
      selector({ lang: 'en' })
    );
    // on simule une langue déjà en 'en-GB'
    i18n.language = 'en-GB';
    // on réinitialise le spy
    changeLanguageMock.mockClear();

    render(<App mode="light" toggleMode={() => {}} />);

    expect(changeLanguageMock).not.toHaveBeenCalled();
  });
});
