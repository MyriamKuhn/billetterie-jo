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

// ─── ❸ Stub ActiveLink ───────────────────────────────────────────────────────
vi.mock('../ActiveLink', () => ({
  __esModule: true,
  ActiveLink: ({ to, children, ...p }: any) => (
    <a data-testid="active-link" data-to={to} {...p}>{children}</a>
  ),
}));

// ─── ❹ Stub MUI components ───────────────────────────────────────────────────
vi.mock('@mui/material', () => ({
  __esModule: true,
  Button: (p: any) => <button data-testid="button" {...p}>{p.children}</button>,
  ListItemButton: (p: any) => <li data-testid="list-item" {...p}>{p.children}</li>,
  ListItemIcon:   (p: any) => <span data-testid="list-item-icon">{p.children}</span>,
  ListItemText:   ({ primary }: any) => <span data-testid="list-item-text">{primary}</span>,
}));

// ─── ❺ Import du composant et de navItems réels (mockés) ────────────────────
import { NavLinkList } from './NavLinkList';
import { navItems }    from './navItems';

describe('<NavLinkList />', () => {
  beforeEach(() => {
    cleanup();
  });

  it('mode mobile : rend ListItemButton pour chaque item avec icône, texte, to et onClick', () => {
    const onNavigate = vi.fn();

    render(<NavLinkList isMobile onNavigate={onNavigate} />);

    const items = screen.getAllByTestId('list-item');
    expect(items).toHaveLength(navItems.length);

    items.forEach((item, idx) => {
      const cfg = navItems[idx];
      // Vérifie le "to" passé
      expect(item).toHaveAttribute('to', cfg.href);
      // L'icône personnalisée est présente
      expect(within(item).getByTestId(`icon-${cfg.key}`)).toBeInTheDocument();
      // Le texte traduit est "navbar.<key>"
      expect(within(item).getByTestId('list-item-text')).toHaveTextContent(`navbar.${cfg.key}`);

      // onClick déclenche onNavigate
      fireEvent.click(item);
      expect(onNavigate).toHaveBeenCalledTimes(idx + 1);
    });
  });

  it('mode desktop : rend Button pour chaque item avec texte et to', () => {
    render(<NavLinkList isMobile={false} />);

    const buttons = screen.getAllByTestId('button');
    expect(buttons).toHaveLength(navItems.length);

    buttons.forEach((btn, idx) => {
      const cfg = navItems[idx];
      // Vérifie le "to" passé
      expect(btn).toHaveAttribute('to', cfg.href);
      // Le texte traduit est "navbar.<key>"
      expect(btn).toHaveTextContent(`navbar.${cfg.key}`);
    });
  });
});
