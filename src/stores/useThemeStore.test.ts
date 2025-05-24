import { beforeEach, describe, it, expect, vi } from 'vitest';
import { useThemeStore } from './useThemeStore';

const STORAGE_KEY = 'theme-mode';

describe('useThemeStore (persisted Zustand store)', () => {
  beforeEach(() => {
    // On vide le localStorage avant chaque test
    localStorage.clear();
    // On reset le store entre les tests
    useThemeStore.setState({ mode: 'light' });
  });

  it('initial state should be "light" and write to localStorage', () => {
    const { mode } = useThemeStore.getState();
    expect(mode).toBe('light');
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.mode).toBe('light');
  });

  it('toggle() should flip mode between "light" and "dark"', () => {
    const { toggle } = useThemeStore.getState();
    toggle();
    expect(useThemeStore.getState().mode).toBe('dark');
    let stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!).state.mode;
    expect(stored).toBe('dark');
    toggle();
    expect(useThemeStore.getState().mode).toBe('light');
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!).state.mode;
    expect(stored).toBe('light');
  });

  it('setDark() should set mode to "dark"', () => {
    useThemeStore.getState().setDark();
    expect(useThemeStore.getState().mode).toBe('dark');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!).state.mode;
    expect(stored).toBe('dark');
  });

  it('setLight() should set mode to "light"', () => {
    useThemeStore.getState().setDark();
    expect(useThemeStore.getState().mode).toBe('dark');
    useThemeStore.getState().setLight();
    expect(useThemeStore.getState().mode).toBe('light');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!).state.mode;
    expect(stored).toBe('light');
  });

  it('rehydrates from localStorage and does not overwrite existing value', async () => {
    // 1. Simule une valeur “dark” dans localStorage AVANT d'importer le store
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { mode: 'dark' }, version: 0 })
    );

    // 2. Réinitialise le cache des modules pour forcer un nouvel import
    vi.resetModules();

    // 3. Importe à nouveau le store (après avoir mis la clé en storage)
    const { useThemeStore: freshUseThemeStore } = await import('./useThemeStore');

    // 4. Vérifie que le store lit bien "dark" et ne le remet pas à "light"
    expect(freshUseThemeStore.getState().mode).toBe('dark');
  });
});

