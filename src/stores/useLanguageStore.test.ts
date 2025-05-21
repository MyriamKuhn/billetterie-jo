import { describe, it, expect, vi, beforeEach } from 'vitest';

// ❶ Désactive persist : on récupère directement la factory
vi.mock('zustand/middleware', () => ({
  __esModule: true,
  persist: (configFn: any, _opts: any) => configFn,
  createJSONStorage: () => localStorage,
}));

// ❷ Stub i18n pour éviter tout effet secondaire (on ne vérifie plus l’appel)
vi.mock('../i18n', () => ({
  __esModule: true,
  default: { changeLanguage: vi.fn() },
}));

// Helper pour overrider navigator.language
function setNavigatorLang(lang: string) {
  Object.defineProperty(navigator, 'language', {
    value: lang,
    configurable: true,
  });
}

describe('useLanguageStore', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('initialise lang depuis navigator.language quand supporté', async () => {
    setNavigatorLang('de-CH');
    const { useLanguageStore } = await import('./useLanguageStore');
    expect(useLanguageStore.getState().lang).toBe('de');
  });

  it('initialise lang à "en" quand navigator.language n’est pas supporté', async () => {
    setNavigatorLang('es-ES');
    const { useLanguageStore } = await import('./useLanguageStore');
    expect(useLanguageStore.getState().lang).toBe('en');
  });

  it('setLang existe et met à jour l’état du store', async () => {
    setNavigatorLang('fr-FR');
    const { useLanguageStore } = await import('./useLanguageStore');

    // Avant : c’est la langue initiale
    const initial = useLanguageStore.getState().lang;
    expect(initial).toBe('fr');

    // on appelle setLang
    useLanguageStore.getState().setLang('en');
    const updated = useLanguageStore.getState().lang;
    expect(updated).toBe('en');
  });
});
