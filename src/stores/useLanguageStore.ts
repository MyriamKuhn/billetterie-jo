import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import i18n from '../i18n';

type Lang = 'fr'|'en'|'de';

/**
 * Determine the initial language:
 * 1. Take the browser’s primary language (before any region tag)
 * 2. If it’s one of our supported codes, use it; otherwise default to English
 */
function getInitialLang(): Lang {
  const nav = (navigator.language.split('-')[0] as Lang);
  return ['fr','en','de'].includes(nav) ? nav : 'en';
}

interface LanguageState {
  /** Current UI language code */
  lang: Lang;
  /**
   * Change the UI language:
   * - update Zustand state
   * - tell i18next to switch its active locale
   */
  setLang: (lang: Lang) => void;
}

/**
 * Zustand store for managing the UI language.
 * - Initializes with the browser's primary language
 * - Persists the language setting in localStorage
 * - Updates i18next when the language changes
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      // Initialize with the browser-determined language
      lang: getInitialLang(),
      setLang: (lang) => {
        // Update the store
        set({ lang });
        // Apply the change in i18next
        i18n.changeLanguage(lang);
      },
    }),
    {
      // Key under which this slice is saved in localStorage
      name: 'language-storage',
      // Use JSON-based localStorage for persistence
      storage: createJSONStorage(() => localStorage),

      /**
       * After rehydrating from storage, ensure i18next
       * is configured to the stored language
       */
      onRehydrateStorage: () => (state) => {
        if (state?.lang) {
          i18n.changeLanguage(state.lang);
        }
      }
    }
  )
);
