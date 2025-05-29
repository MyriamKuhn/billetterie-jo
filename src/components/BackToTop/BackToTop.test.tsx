import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'scroll.back_to_top') return 'scroll back to top';
      return key;
    },
    i18n: { changeLanguage: async () => {} },
  }),
}));

// 1️⃣ Stub useScrollTrigger
vi.mock('@mui/material/useScrollTrigger', () => ({
  __esModule: true,
  default: vi.fn(),
}));
import useScrollTrigger from '@mui/material/useScrollTrigger';
const mockedTrigger = useScrollTrigger as ReturnType<typeof vi.fn>;

// 2️⃣ Stub Box, Fab, Zoom, Icon
vi.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ id, onClick, role, children }: any) =>
    id === 'back-to-top-anchor'
      ? <div data-testid="anchor" id={id} />
      : <div data-testid="scrolltop-box" role={role} onClick={onClick}>{children}</div>,
}));
vi.mock('@mui/material/Fab', () => ({
  __esModule: true,
  default: ({ 'aria-label': label, children, sx }: any) =>
    <button data-testid="fab" aria-label={label} data-sx={JSON.stringify(sx)}>
      {children}
    </button>,
}));
vi.mock('@mui/material/Zoom', () => ({
  __esModule: true,
  default: ({ in: inProp, children }: any) =>
    inProp ? <div data-testid="zoom">{children}</div> : <div data-testid="zoom-hidden" />,
}));
vi.mock('@mui/icons-material/KeyboardArrowUp', () => ({
  __esModule: true,
  default: () => <span data-testid="icon">↑</span>,
}));

// 3️⃣ Stub useTheme
const fakeThemeLight = { palette: { mode: 'light' as const } };
const fakeThemeDark  = { palette: { mode: 'dark'  as const } };
vi.mock('@mui/material/styles', () => ({
  __esModule: true,
  useTheme: vi.fn(() => fakeThemeLight),
}));
import { useTheme } from '@mui/material/styles';

// 4️⃣ Import après les mocks
import BackToTop, { ScrollTop } from './BackToTop';

describe('<ScrollTop />', () => {
  beforeEach(() => {
    cleanup();
    mockedTrigger.mockReset();
    document.body.innerHTML = '';
  });

  it('passe les bons args à useScrollTrigger (target undefined)', () => {
    mockedTrigger.mockReturnValue(false);
    render(<ScrollTop><div data-testid="child" /></ScrollTop>);
    expect(mockedTrigger).toHaveBeenCalledWith({
      target: undefined,
      disableHysteresis: true,
      threshold: 100,
    });
  });

  it('passe les bons args à useScrollTrigger (target via prop window)', () => {
    mockedTrigger.mockReturnValue(false);
    const fakeWin = {} as Window;
    render(
      <ScrollTop window={() => fakeWin}>
        <div data-testid="child" />
      </ScrollTop>
    );
    expect(mockedTrigger).toHaveBeenCalledWith({
      target: fakeWin,
      disableHysteresis: true,
      threshold: 100,
    });
  });

  it('cache/affiche l’enfant selon trigger', () => {
    mockedTrigger.mockReturnValue(false);
    render(<ScrollTop><div data-testid="child" /></ScrollTop>);
    expect(screen.queryByTestId('zoom')).toBeNull();
    expect(screen.getByTestId('zoom-hidden')).toBeInTheDocument();

    mockedTrigger.mockReturnValue(true);
    cleanup();
    render(<ScrollTop><div data-testid="child" /></ScrollTop>);
    expect(screen.getByTestId('zoom')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('handleClick n’échoue pas sans ancre et utilise document.querySelector en fallback', () => {
    mockedTrigger.mockReturnValue(true);
    const docSpy = vi.spyOn(document, 'querySelector').mockReturnValue(null);

    render(<ScrollTop><button data-testid="btn">OK</button></ScrollTop>);
    fireEvent.click(screen.getByTestId('btn'));

    expect(docSpy).toHaveBeenCalledWith('#back-to-top-anchor');
    docSpy.mockRestore();
  });

  it('handleClick appelle scrollIntoView quand ancre existe', () => {
    mockedTrigger.mockReturnValue(true);
    const anchor = document.createElement('div');
    anchor.id = 'back-to-top-anchor';
    document.body.append(anchor);
    const scrollSpy = vi.fn();
    // @ts-ignore
    anchor.scrollIntoView = scrollSpy;

    render(<ScrollTop><button data-testid="btn">OK</button></ScrollTop>);
    fireEvent.click(screen.getByTestId('btn'));

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });

  it('handleClick fallback à document si ownerDocument undefined', () => {
    mockedTrigger.mockReturnValue(true);
    const docSpy = vi.spyOn(document, 'querySelector').mockReturnValue(null);

    render(<ScrollTop><button data-testid="btn">OK</button></ScrollTop>);
    // On override ownerDocument sur la box
    const box = screen.getByTestId('scrolltop-box');
    Object.defineProperty(box, 'ownerDocument', { value: undefined, configurable: true });

    // On clique sur le bouton, l’event bubble jusqu’au Box
    fireEvent.click(screen.getByTestId('btn'));

    expect(docSpy).toHaveBeenCalledWith('#back-to-top-anchor');
    docSpy.mockRestore();
  });
});

describe('<BackToTop /> intégration', () => {
  beforeEach(cleanup);

  it('rend l’ancre et masque la fab si pas scroll', () => {
    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue(fakeThemeLight);
    mockedTrigger.mockReturnValue(false);

    render(<BackToTop />);
    expect(screen.getByTestId('anchor')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-hidden')).toBeInTheDocument();
  });

  it('affiche la fab et applique le bon sx selon thème dark', () => {
    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue(fakeThemeDark);
    mockedTrigger.mockReturnValue(true);

    render(<BackToTop />);
    expect(screen.getByTestId('zoom')).toBeInTheDocument();
    const fab = screen.getByTestId('fab');
    expect(fab).toHaveAttribute('aria-label', 'scroll back to top');
    const sx = JSON.parse(fab.getAttribute('data-sx')!);
    expect(sx.bgcolor).toBe('primary.dark');
  });
});
