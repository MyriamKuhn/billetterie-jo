import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PaletteMode } from '@mui/material';

interface ThemeState {
  mode: PaletteMode;
  toggle: () => void;
  setLight: () => void;
  setDark: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      toggle: () =>
        set((state) => ({
          mode: state.mode === 'light' ? 'dark' : 'light',
        })),
      setLight: () => set({ mode: 'light' }),
      setDark: () => set({ mode: 'dark' }),
    }),
    {
      name: 'theme-mode',            
      storage: createJSONStorage(() => localStorage)
    }
  )
);
