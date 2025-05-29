import i18n from './i18n';
import dayjs from 'dayjs';
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

describe('Configuration i18n (HTTP-backend)', () => {
  it('n’a pas de ressources statiques chargées dans resourceStore', () => {
    const data = i18n.services.resourceStore.data;
    expect(data.en?.common).toBeUndefined();
    expect(data.fr?.common).toBeUndefined();
    expect(data.de?.common).toBeUndefined();
  });

  it('a configuré le backend avec le bon loadPath', () => {
    // @ts-ignore accéder au backend directement
    const backendOptions = (i18n.services.backendConnector as any).backend.options;
    expect(backendOptions.loadPath).toBe('/locales/{{lng}}/{{ns}}.json');
  });

  it('a les bons paramètres généraux', () => {
    const fallback = i18n.options.fallbackLng;
    expect(Array.isArray(fallback) ? fallback : [fallback]).toContain('en');
    expect(i18n.options.supportedLngs).toEqual(expect.arrayContaining(['fr', 'en', 'de']));
    expect(i18n.options.defaultNS).toBe('common');
    expect(i18n.options.detection).toMatchObject({
      order: ['querystring', 'cookie', 'navigator'],
      caches: ['cookie'],
    });
  });

  it('a bien configuré l’interpolation et React', () => {
    expect(i18n.options.interpolation).toMatchObject({ escapeValue: false });
    expect(i18n.options.react).toMatchObject({ useSuspense: false });
  });
});

describe('Integration i18n ↔ dayjs locale', () => {
  let localeSpy: (lng: string) => string;
  let originalLocale: typeof dayjs.locale;

  beforeAll(() => {
    // stub pour répondre synchroniquement au backend
    const backend = (i18n.services.backendConnector as any).backend;
    (backend as any).read = (_lng: string, _ns: string, cb: any) => cb(null, {});
  });

  beforeEach(() => {
    originalLocale = dayjs.locale;
    localeSpy = vi.fn((lng: string) => lng);
    // override locale
    (dayjs as any).locale = localeSpy;
  });

  afterEach(() => {
    // restore
    (dayjs as any).locale = originalLocale;
  });

  it('appel dayjs.locale avec la même langue si elle est supportée', async () => {
    await i18n.changeLanguage('fr');
    expect(localeSpy).toHaveBeenCalledWith('fr');
  });

  it('retombe sur "en" si la langue n’est pas supportée', async () => {
    await i18n.changeLanguage('es');
    expect(localeSpy).toHaveBeenCalledWith('en');
  });

  it("réagit directement à l'événement languageChanged", () => {
    // simulate event listener invocation
    i18n.emit('languageChanged', 'de');
    expect(localeSpy).toHaveBeenCalledWith('de');
    (localeSpy as unknown as { mockClear: () => void }).mockClear();
    i18n.emit('languageChanged', 'es');
    expect(localeSpy).toHaveBeenCalledWith('en');
  });
});
