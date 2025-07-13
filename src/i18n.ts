import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import 'dayjs/locale/de';
import 'dayjs/locale/en';

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    fallbackLng: 'en',
    supportedLngs: ['fr','en','de'],
    detection: {
      order: ['querystring', 'cookie', 'navigator'],
      caches: ['cookie'],
    },
    ns: ['common', 'legal', 'privacy', 'terms', 'contact', 'home', 'ticket', 'cart', 'login', 'errors', 'signup', 'verification', 'passwordReset', 'forgotPassword', 'userDashboard', 'tickets', 'invoices', 'checkout', 'unauthorized', 'adminProducts', 'users', 'orders', 'payments'],
    defaultNS: 'common',
    fallbackNS: 'errors',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  i18n.on('languageChanged', (lng) => {
    dayjs.locale(['fr','de','en'].includes(lng) ? lng : 'en');
  });

export default i18n;
