import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
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
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['fr','en','de'],
    detection: {
      order: ['querystring', 'cookie', 'navigator'],
      caches: ['cookie'],
    },
    resources,
    ns: ['common'],    
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
