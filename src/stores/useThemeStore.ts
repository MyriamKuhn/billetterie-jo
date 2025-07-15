import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PaletteMode } from '@mui/material';

interface ThemeState {
  /** Current theme mode ('light' or 'dark') */
  mode: PaletteMode;
  /** Toggle between light and dark modes */
  toggle: () => void;
  /** Explicitly set light mode */
  setLight: () => void;
  /** Explicitly set dark mode */
  setDark: () => void;
}

/**
 * Custom hook to manage the theme mode (light/dark) using Zustand.
 * It provides methods to toggle between light and dark modes,
 * and to set the mode explicitly.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // Default to light mode
      mode: 'light',
      // Switch to the opposite mode
      toggle: () =>
        set((state) => ({
          mode: state.mode === 'light' ? 'dark' : 'light',
        })),
      // Force light mode
      setLight: () => set({ mode: 'light' }),
      // Force dark mode
      setDark: () => set({ mode: 'dark' }),
    }),
    {
      // Storage key for persisting theme choice
      name: 'theme-mode',     
      // Use localStorage via JSON to persist across sessions       
      storage: createJSONStorage(() => localStorage)
    }
  )
);
