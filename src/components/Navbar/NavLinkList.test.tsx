import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';

// ❶ Stub du module navItems
vi.mock('./navItems', () => ({
  __esModule: true,
  navItems: [
    { key: 'home',  href: '/home',  icon: () => <span data-testid="icon-home" /> },
    { key: 'about', href: '/about', icon: () => <span data-testid="icon-about"/> },
  ],
}));

// ❷ Stub react-i18next
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (k: string) => k }),
}));

// ❸ Stub ActiveLink (export default)
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

  it('mode mobile : rend un lien pour chaque item et ferme le drawer via onNavigate si fourni', () => {
    const onNavigate = vi.fn();
    render(<NavLinkList isMobile onNavigate={onNavigate} />);

    const links = screen.getAllByTestId('active-link');
    expect(links).toHaveLength(navItems.length);

    links.forEach((link, idx) => {
      const cfg = navItems[idx];
      expect(link).toHaveAttribute('data-to', cfg.href);
      expect(within(link).getByTestId(`icon-${cfg.key}`)).toBeInTheDocument();
      expect(link).toHaveTextContent(`navbar.${cfg.key}`);

      fireEvent.click(link);
      expect(onNavigate).toHaveBeenCalledTimes(idx + 1);
    });
  });

  it('mode mobile sans onNavigate : ne scrolle plus, n\'appelle que la navigation', () => {
    render(<NavLinkList isMobile />);

    const links = screen.getAllByTestId('active-link');
    expect(links).toHaveLength(navItems.length);

    // spy on scrollTo
    const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    fireEvent.click(links[0]);
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('mode desktop : rend un lien pour chaque item sans onNavigate', () => {
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
