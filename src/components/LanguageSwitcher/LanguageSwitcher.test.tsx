import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// 1) Stub react-world-flags
vi.mock('react-world-flags', () => ({
  __esModule: true,
  default: ({ code }: { code: string }) => <span data-testid={`flag-${code}`} />,
}));

// 2) Stub @mui/material Select/MenuItem
vi.mock('@mui/material', () => ({
  __esModule: true,
  Select: ({
    value,
    onChange,
    'aria-label': ariaLabel,
    renderValue,
    children,
  }: any) => (
    <div>
      <span data-testid="current">{renderValue(value)}</span>
      <select role="combobox" aria-label={ariaLabel} value={value} onChange={onChange}>
        {children}
      </select>
    </div>
  ),
  MenuItem: ({ value, children }: any) => (
    <option role="option" value={value}>
      <span data-testid={`flag-${value.toUpperCase()}`}>{/* in-Option flag */}</span>
      {children}
    </option>
  ),
}));

// 3) Stub react-i18next
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key }),
}));

// 4) Stub Zustand store
vi.mock('../../stores/useLanguageStore', () => {
  let state = { lang: 'fr' };
  const setLang = (newLang: string) => { state.lang = newLang; };
  return {
    __esModule: true,
    useLanguageStore: (selector: (s: any) => any) => selector({ lang: state.lang, setLang }),
  };
});

// 5) Import du composant APRÈS les mocks
import { LanguageSwitcher } from './LanguageSwitcher';

describe('<LanguageSwitcher />', () => {
  beforeEach(() => {
    cleanup();
  });

  it('affiche le drapeau de la langue courante (dans le renderValue)', () => {
    const { rerender } = render(<LanguageSwitcher />);
    // on ne cherche que DANS "current"
    const current = screen.getByTestId('current');
    expect(within(current).getByTestId('flag-FR')).toBeInTheDocument();
    // re-render basique
    rerender(<LanguageSwitcher />);
  });

  it('propose les trois options avec leurs labels', () => {
    render(<LanguageSwitcher />);
    const options = screen.getAllByRole('option');
    const vals    = options.map(o => (o as HTMLOptionElement).value);
    const texts   = options.map(o => o.textContent);
    expect(vals).toEqual(['fr','en','de']);
    expect(texts).toEqual(['Français','English','Deutsch']);
  });

  it('change de langue et met à jour le drapeau dans renderValue après re-render', () => {
    const { rerender } = render(<LanguageSwitcher />);
    const select = screen.getByRole('combobox');

    // change event déclenche setLang interne
    fireEvent.change(select, { target: { value: 'de' } });

    // re-render pour lire le nouveau state.lang
    rerender(<LanguageSwitcher />);
    const current = screen.getByTestId('current');
    expect(within(current).getByTestId('flag-DE')).toBeInTheDocument();
  });

    it('ne rend pas de drapeau si la langue n’est pas supportée', () => {
    // On monte normalement
    const { rerender } = render(<LanguageSwitcher />);
    
    // On simule le choix d'une langue non listée
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'es' } });

    // On re-render pour que le composant relise le nouveau state.lang
    rerender(<LanguageSwitcher />);

    // On ne cherche que DANS le renderValue
    const current = screen.getByTestId('current');
    expect(within(current).queryByTestId('flag-ES')).toBeNull();
  });
});