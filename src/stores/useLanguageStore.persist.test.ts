import { beforeEach, describe, it, expect, vi } from 'vitest';

const STORAGE_KEY = 'language-storage';

// ── ❶ Stub i18n.changeLanguage pour espionner l’appel ───────────────────────
vi.mock('../i18n', () => ({
  __esModule: true,
  default: { changeLanguage: vi.fn() },
}));

// ── ❷ On n’override PAS zustand/middleware, on veut le vrai persist !

describe('useLanguageStore ‹persist› middleware', () => {
  beforeEach(() => {
    // Clear JSDOM storage + module cache
    localStorage.clear();
    vi.resetModules();
  });

  it('écrit bien dans le localStorage lors de setLang', async () => {
    // 1) Import à chaud pour que persist prenne effet
    const { useLanguageStore } = await import('./useLanguageStore');
    // 2) Action : on change la langue
    useLanguageStore.getState().setLang('de');
    // 3) Vérif persistence
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.lang).toBe('de');
  });

  it('appelle i18n.changeLanguage lors de la réhydratation', async () => {
    // 1) Prépeuplage du storage comme si l’utilisateur avait déjà choisi une langue
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { lang: 'de' } })
    );
    // 2) Import du store (le middleware persist doit détecter ce storage)
    const [ { useLanguageStore }, { default: i18n } ] = await Promise.all([
      import('./useLanguageStore'),
      import('../i18n'),
    ]);
    // 3) Attendre le cycle interne de réhydratation
    await new Promise(r => setTimeout(r, 0));
    // 4) Le store a bien pris la valeur
    expect(useLanguageStore.getState().lang).toBe('de');
    // 5) Et i18n.changeLanguage a été appelé avec 'de'
    expect(i18n.changeLanguage).toHaveBeenCalledWith('de');
  });

  it('ne déclenche pas i18n.changeLanguage si state.lang est absent', async () => {
    // 1) Stocke un objet sans `lang`
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { /* lang missing */ } })
    );

    // 2) Importe le store et le stub i18n
    const [{ useLanguageStore }, { default: i18n }] = await Promise.all([
      import('./useLanguageStore'),
      import('../i18n'),
    ]);

    // 2b) Vide tous les appels précédents
    const changeLang = vi.mocked(i18n.changeLanguage);
    changeLang.mockClear();

    // 3) Attend le cycle de réhydratation
    await new Promise(r => setTimeout(r, 0));

    // 4a) Le store garde sa valeur initiale
    const current = useLanguageStore.getState().lang;
    expect(current).toMatch(/^(fr|en|de)$/);

    // 4b) Aucun appel **après** le mockClear
    expect(changeLang).not.toHaveBeenCalled();
  });
});
