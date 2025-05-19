import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 1) On importe les JSON
import enCommon from './locales/en/common.json';
import frCommon from './locales/fr/common.json';
import deCommon from './locales/de/common.json';

const resources = {
  en: { common: enCommon },
  fr: { common: frCommon },
  de: { common: deCommon }, 
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',            // default language
    fallbackLng: 'en',
    ns: ['common'],       // namespace common declaration
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
