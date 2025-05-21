// src/stores/useLanguageStore.persistConfig.test.ts
import { beforeAll, describe, it, expect, vi } from 'vitest';

// ── ❶ On capture persistOptions via `var` pour éviter le TDZ
var persistOptions: any;

// ── ❷ Mock du middleware Zustand pour intercepter `persist(...)`
vi.mock('zustand/middleware', () => ({
  __esModule: true,
  persist: (configFn: any, options: any) => {
    persistOptions = options;
    return configFn;
  },
  createJSONStorage: () => localStorage,
}));

// ── ❸ Stub de i18n.changeLanguage
vi.mock('../i18n', () => ({
  __esModule: true,
  default: { changeLanguage: vi.fn() },
}));

// ── ❹ Import de i18n et du store APRÈS les mocks
import i18n from '../i18n';
import './useLanguageStore';

describe('onRehydrateStorage handler', () => {
  let changeLanguageMock: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    // i18n.changeLanguage est un vi.fn() grâce au stub
    changeLanguageMock = i18n.changeLanguage as unknown as ReturnType<typeof vi.fn>;
  });

  it('appelle changeLanguage(lang) si state.lang existe', () => {
    const handler = persistOptions.onRehydrateStorage();
    handler({ lang: 'de' });
    expect(changeLanguageMock).toHaveBeenCalledWith('de');
  });

  it('ne fait rien si state.lang est absent', () => {
    changeLanguageMock.mockClear();
    const handler = persistOptions.onRehydrateStorage();
    handler({});
    expect(changeLanguageMock).not.toHaveBeenCalled();
  });
});
