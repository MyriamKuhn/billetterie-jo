import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, beforeEach, expect, vi } from 'vitest';

// ─── 1) Stub react-i18next ─────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (k: string) => k }), 
}));

// ─── 2) Stub zustand store ──────────────────────────────────────────────────────
let currentLang = 'fr';
const setLangSpy = vi.fn((l: string) => { currentLang = l; });
vi.mock('../../stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: (selector: any) =>
    selector({ lang: currentLang, setLang: setLangSpy }),
}));

// ─── 3) Import du composant APRÈS les mocks ─────────────────────────────────────
import LanguageSwitcher from './LanguageSwitcher';

describe('<LanguageSwitcher />', () => {
  beforeEach(() => {
    currentLang = 'fr';
    setLangSpy.mockReset();
  });

  it('affiche le drapeau de la langue courante via renderValue', () => {
    render(<LanguageSwitcher />);
    // on cible le combobox (il n'a pas de name exposé dans l'accessibility tree)
    const combobox = screen.getByRole('combobox');
    expect(
      within(combobox).getByRole('img', { name: 'Flag FR' })
    ).toBeInTheDocument();
  });

  it('propose 3 options avec leurs drapeaux et labels', async () => {
    render(<LanguageSwitcher />);
    const combobox = screen.getByRole('combobox');
    await userEvent.click(combobox);

    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(3);

    const [optFr, optEn, optDe] = options;
    expect(optFr).toHaveTextContent('Français');
    expect(within(optFr).getByRole('img', { name: 'Flag FR' })).toBeInTheDocument();

    expect(optEn).toHaveTextContent('English');
    expect(within(optEn).getByRole('img', { name: 'Flag US' })).toBeInTheDocument();

    expect(optDe).toHaveTextContent('Deutsch');
    expect(within(optDe).getByRole('img', { name: 'Flag DE' })).toBeInTheDocument();
  });

  it('appelle setLang et met à jour le drapeau après sélection', async () => {
    // on utilise destructuration pour récupérer rerender
    const { rerender } = render(<LanguageSwitcher />);
    const combobox = screen.getByRole('combobox');
    await userEvent.click(combobox);

    // clique sur "Deutsch"
    const optDe = await screen.findByRole('option', { name: /Deutsch/ });
    await userEvent.click(optDe);

    // vérifie l'appel
    expect(setLangSpy).toHaveBeenCalledOnce();
    expect(setLangSpy).toHaveBeenCalledWith('de');

    // on rerend le même composant (au lieu de render() à nouveau)
    rerender(<LanguageSwitcher />);
    const cb2 = screen.getByRole('combobox');
    expect(within(cb2).getByRole('img', { name: 'Flag DE' })).toBeInTheDocument();
  });

  it('ne rend aucun drapeau si la langue n’est pas supportée', () => {
    currentLang = 'es';
    render(<LanguageSwitcher />);
    const combobox = screen.getByRole('combobox');
    expect(within(combobox).queryByRole('img')).toBeNull();
  });
});
