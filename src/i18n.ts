import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import 'dayjs/locale/de';
import 'dayjs/locale/en';

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend'

i18n
  // Load translations via HTTP (e.g. from `/locales/{{lng}}/{{ns}}.json`)
  .use(Backend)
  // Detect user language (querystring, cookie, navigator, etc.)
  .use(LanguageDetector)
  // Hook into React
  .use(initReactI18next)
  .init({
    backend: {
      // Path pattern to load each namespace/json file
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Default language if detection fails
    fallbackLng: 'en',
    // Only these languages are supported
    supportedLngs: ['fr','en','de'],
    detection: {
      // Order to look for language from: URL -> cookie -> browser settings
      order: ['querystring', 'cookie', 'navigator'],
      // Remember selection in a cookie
      caches: ['cookie'],
    },
    // All the namespaces using in app
    ns: ['common', 'legal', 'privacy', 'terms', 'contact', 'home', 'ticket', 'cart', 'login', 'errors', 'signup', 'verification', 'passwordReset', 'forgotPassword', 'userDashboard', 'tickets', 'invoices', 'checkout', 'unauthorized', 'adminProducts', 'users', 'orders', 'payments', 'employee'],
    // Default namespace if none is specified
    defaultNS: 'common',
    // Fallback namespace when a key is missing
    fallbackNS: 'errors',
    // Do not escape values (React already protects against XSS)
    interpolation: { escapeValue: false },
    // Disable suspense mode in react-i18next
    react: { useSuspense: false },
  });

  // Keep Day.js locale in sync with i18next
  i18n.on('languageChanged', (lng) => {
    // If the chosen language isn’t one of our imports, default to 'en'
    dayjs.locale(['fr','de','en'].includes(lng) ? lng : 'en');
  });

export default i18n;
