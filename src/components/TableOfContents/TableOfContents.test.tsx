// src/components/TableOfContents/TableOfContents.test.tsx
import '@testing-library/jest-dom';
import { render, screen, fireEvent, within, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1️⃣ Stub useTranslation
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => `${key}-t`,
  }),
}));

// 2️⃣ Stub useTheme
const fakeTheme = {
  mixins: { toolbar: { minHeight: 64 } },
  palette: { divider: 'div', background: { paper: 'paper' } }
};
vi.mock('@mui/material/styles', () => ({
  __esModule: true,
  useTheme: () => fakeTheme,
}));

// 3️⃣ Stub MUI components, capture sx et onClose
let sidebarSx: any;
let drawerOnClose: () => void;

vi.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ component, role, sx, children }: any) => {
    if (component === 'nav') sidebarSx = sx;
    const testid = component === 'nav'
      ? 'sidebar'
      : role === 'presentation'
      ? 'drawer-box'
      : 'box';
    return <div data-testid={testid}>{children}</div>;
  },
}));
vi.mock('@mui/material/List', () => ({
  __esModule: true,
  default: ({ children }: any) => <ul data-testid="list">{children}</ul>,
}));
vi.mock('@mui/material/ListItemButton', () => ({
  __esModule: true,
  default: ({ href, onClick, children }: any) => (
    <a data-testid="item" href={href} onClick={onClick}>{children}</a>
  ),
}));
vi.mock('@mui/material/ListItemText', () => ({
  __esModule: true,
  default: ({ primary }: any) => <span data-testid="text">{primary}</span>,
}));
vi.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="typography">{children}</div>,
}));
vi.mock('@mui/material/IconButton', () => ({
  __esModule: true,
  default: ({ onClick, children }: any) => (
    <button data-testid="iconbutton" onClick={onClick}>{children}</button>
  ),
}));
vi.mock('@mui/material/Drawer', () => ({
  __esModule: true,
  default: ({ open, onClose, children }: any) => {
    drawerOnClose = onClose;
    return <div data-testid="drawer" data-open={open}>{children}</div>;
  },
}));
vi.mock('@mui/icons-material/Menu', () => ({
  __esModule: true,
  default: () => <span data-testid="menu-icon">≡</span>,
}));

// 4️⃣ Import APRÈS les mocks
import { TableOfContents } from './TableOfContents';

// sections défini comme tuple mutable
const sections: [string, string][] = [
  ['secA', 'textA'],
  ['secB', 'textB'],
];
const makeId = (key: string) => key.toLowerCase();

describe('<TableOfContents />', () => {
  beforeEach(() => {
    cleanup();
    sidebarSx = undefined;
    drawerOnClose = undefined!;
  });

  it('renders sidebar with translated title, list items and applies border sx correctly', () => {
    render(
      <TableOfContents
        sections={sections}
        makeId={makeId}
        titleKey="ns.title"
        namespace="ns"
      />
    );

    // Sidebar présent
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toBeInTheDocument();

    // border sx renvoyé sous forme de fonction
    expect(typeof sidebarSx.border).toBe('function');
    expect(sidebarSx.border(fakeTheme))
      .toBe(`1px solid ${fakeTheme.palette.divider}`);

    // Titre traduit
    expect(within(sidebar).getByTestId('typography'))
      .toHaveTextContent('ns.title-t');

    // Items
    const items = within(sidebar).getAllByTestId('item');
    expect(items).toHaveLength(sections.length);
    sections.forEach(([sk], idx) => {
      expect(items[idx]).toHaveAttribute('href', `#${makeId(sk)}`);
      expect(within(items[idx]).getByTestId('text'))
        .toHaveTextContent(`ns.${sk}-t`);
    });
  });

  it('toggles drawer open/close on mobile and closes when clicking an item', () => {
    render(
      <TableOfContents
        sections={sections}
        makeId={makeId}
        titleKey="ns.title"
        namespace="ns"
      />
    );

    const drawer = screen.getByTestId('drawer');
    // fermé par défaut
    expect(drawer).toHaveAttribute('data-open', 'false');

    // ouverture via IconButton
    fireEvent.click(screen.getByTestId('iconbutton'));
    expect(drawer).toHaveAttribute('data-open', 'true');

    // fermer en cliquant sur un item
    const drawerBox = screen.getByTestId('drawer-box');
    const drawerItems = within(drawerBox).getAllByTestId('item');
    fireEvent.click(drawerItems[0]);
    expect(screen.getByTestId('drawer'))
      .toHaveAttribute('data-open', 'false');
  });

  it('passes onClose prop to Drawer and calling it closes the drawer', () => {
    render(
      <TableOfContents
        sections={sections}
        makeId={makeId}
        titleKey="ns.title"
        namespace="ns"
      />
    );

    // d'abord, on ouvre
    fireEvent.click(screen.getByTestId('iconbutton'));
    expect(screen.getByTestId('drawer')).toHaveAttribute('data-open', 'true');

    // onClose a bien été capturé
    expect(typeof drawerOnClose).toBe('function');

    // simuler onClose (clic hors du drawer)
    act(() => drawerOnClose());
    // drawer doit être fermé
    expect(screen.getByTestId('drawer'))
      .toHaveAttribute('data-open', 'false');
  });
});



