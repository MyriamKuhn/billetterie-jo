import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';

// ─── ❶ Stub du module navItems ───────────────────────────────────────────────
vi.mock('./navItems', () => ({
  __esModule: true,
  navItems: [
    { key: 'home',  href: '/home',  icon: () => <span data-testid="icon-home" /> },
    { key: 'about', href: '/about', icon: () => <span data-testid="icon-about"/> },
  ],
}));

// ─── ❷ Stub react-i18next ────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (k: string) => k }),
}));

// ─── ❸ Stub ActiveLink (export default) ───────────────────────────────────────
vi.mock('../ActiveLink', () => ({
  __esModule: true,
  default: ({ to, children, ...p }: any) => (
    <a data-testid="active-link" data-to={to} {...p}>
      {children}
    </a>
  ),
}));

import { NavLinkList } from './NavLinkList';
import { navItems }   from './navItems';

describe('<NavLinkList />', () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('mode mobile : rend un <a data-testid="active-link"> pour chaque item avec icône, texte, to et onClick', () => {
    const onNavigate = vi.fn();
    render(<NavLinkList isMobile onNavigate={onNavigate} />);

    const links = screen.getAllByTestId('active-link');
    expect(links).toHaveLength(navItems.length);

    links.forEach((link, idx) => {
      const cfg = navItems[idx];
      // ❶ le to arrive bien dans data-to
      expect(link).toHaveAttribute('data-to', cfg.href);

      // ❷ l'icône custom est rendue
      expect(within(link).getByTestId(`icon-${cfg.key}`)).toBeInTheDocument();

      // ❸ le texte traduit est navbar.<key>
      expect(link).toHaveTextContent(`navbar.${cfg.key}`);

      // ❹ onNavigate est appelé quand on clique
      fireEvent.click(link);
      expect(onNavigate).toHaveBeenCalledTimes(idx + 1);
    });
  });

  it('mode mobile sans onNavigate : appelle seulement window.scrollTo', () => {
    // Espionner scrollTo
    const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    // Pas de onNavigate
    render(<NavLinkList isMobile />);

    const links = screen.getAllByTestId('active-link');
    expect(links).toHaveLength(navItems.length);

    // Cliquer sur le premier lien
    fireEvent.click(links[0]);

    // onNavigate n'existe pas, on vérifie que scrollTo a été appelé
    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('mode desktop : rend un <a data-testid="active-link"> pour chaque item avec texte et to', () => {
    render(<NavLinkList isMobile={false} />);

    const links = screen.getAllByTestId('active-link');
    expect(links).toHaveLength(navItems.length);

    links.forEach((link, idx) => {
      const cfg = navItems[idx];
      expect(link).toHaveAttribute('data-to', cfg.href);
      expect(link).toHaveTextContent(`navbar.${cfg.key}`);
    });
  });
});


