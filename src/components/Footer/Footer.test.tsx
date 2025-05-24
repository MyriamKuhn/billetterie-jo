import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1️⃣ Mock du sous‐module Box
vi.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ sx, component, children }: any) => (
    <div
      data-testid={`box-${component ?? 'div'}`}
      data-sx={JSON.stringify(sx)}
    >
      {children}
    </div>
  ),
}));

// 2️⃣ Mock useMediaQuery
vi.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: vi.fn(),
}));

// 3️⃣ Mock Typography
vi.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children }: any) => <p>{children}</p>,
}));

// 4️⃣ Mock ActiveButton et useTranslation
vi.mock('../ActiveButton', () => ({
  __esModule: true,
  default: ({ to, children }: any) => <button data-to={to}>{children}</button>,
}));
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      key === 'footer.copy' && opts?.year ? `© ${opts.year} Test` : key,
  }),
}));

import Footer from './Footer';
import useMediaQuery from '@mui/material/useMediaQuery';

describe('<Footer /> style sx', () => {
  const mockedUseMediaQuery = useMediaQuery as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('desktop : row layout, center align/justify, gap 2, py 1.5 ; copyright py 1', () => {
    mockedUseMediaQuery.mockReturnValue(false);
    render(<Footer />);

    // 2ᵉ Box : layout des liens
    const [layoutBox, copyBox] = screen.getAllByTestId('box-div');
    const sxLayout = JSON.parse(layoutBox.getAttribute('data-sx')!);
    expect(sxLayout).toMatchObject({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      py: 1.5,
    });

    // 3ᵉ Box : copyright
    const sxCopy = JSON.parse(copyBox.getAttribute('data-sx')!);
    expect(sxCopy).toMatchObject({ py: 1 });
  });

  it('mobile : column layout, gap 1, py 1 ; copyright py 0.5', () => {
    mockedUseMediaQuery.mockReturnValue(true);
    render(<Footer />);

    const [layoutBox, copyBox] = screen.getAllByTestId('box-div');
    const sxLayout = JSON.parse(layoutBox.getAttribute('data-sx')!);
    expect(sxLayout).toMatchObject({
      flexDirection: 'column',
      gap: 1,
      py: 1,
    });

    const sxCopy = JSON.parse(copyBox.getAttribute('data-sx')!);
    expect(sxCopy).toMatchObject({ py: 0.5 });
  });
});


