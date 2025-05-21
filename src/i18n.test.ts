import i18n from './i18n';
import enCommon from './locales/en/common.json';
import frCommon from './locales/fr/common.json';
import deCommon from './locales/de/common.json';

describe('Configuration i18n', () => {
  it('charge bien les ressources dans i18next', () => {
    expect(i18n.services.resourceStore.data).toEqual({
      en: { common: enCommon },
      fr: { common: frCommon },
      de: { common: deCommon },
    });
  });

  it('a les bons paramètres généraux', () => {
    // fallbackLng est toujours normalisé en tableau
    expect(i18n.options.fallbackLng).toContain('en');

    // supportedLngs contient au moins ['fr','en','de']
    expect(i18n.options.supportedLngs).toEqual(
      expect.arrayContaining(['fr', 'en', 'de'])
    );

    // namespace par défaut et options de détection
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
