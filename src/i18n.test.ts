import i18n from './i18n';

describe('Configuration i18n (HTTP-backend)', () => {
  it('n’a pas de ressources statiques chargées dans resourceStore', () => {
    // resourceStore.data devrait être vide ou n’avoir que la langue par défaut (sans namespace)
    const data = i18n.services.resourceStore.data;
    // Au minimum, pas de namespace "common" directement chargé
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
    // fallbackLng est normalisé en tableau ou en string
    const fallback = i18n.options.fallbackLng;
    // peut être 'en' ou ['en']
    expect(Array.isArray(fallback) ? fallback : [fallback]).toContain('en');

    // supportedLngs contient au moins ['fr','en','de']
    expect(i18n.options.supportedLngs).toEqual(
      expect.arrayContaining(['fr', 'en', 'de'])
    );

    // namespace par défaut
    expect(i18n.options.defaultNS).toBe('common');

    // options de détection
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
