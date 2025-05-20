import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import i18n from '../i18n';

type Lang = 'fr'|'en'|'de';

function getInitialLang(): Lang {
  const nav = (navigator.language.split('-')[0] as Lang);
  return ['fr','en','de'].includes(nav) ? nav : 'en';
}

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: getInitialLang(),
      setLang: (lang) => {
        set({ lang });
        i18n.changeLanguage(lang);
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.lang) {
          i18n.changeLanguage(state.lang);
        }
      }
    }
  )
);
