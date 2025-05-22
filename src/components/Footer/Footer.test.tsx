import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, type Mock } from 'vitest';

// 1) Mock du module MUI pour surcharger useMediaQuery
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn(),
  };
});

// 2) Mock ActiveButton
vi.mock('../ActiveButton', () => ({
  default: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <button data-to={to}>{children}</button>
  ),
}));

// 3) Mock useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'footer.copy' && options?.year) {
        return `© ${options.year} Test`;
      }
      return key;
    },
  }),
}));

import Footer from './Footer';
import * as mui from '@mui/material';

// 4) Récupère le mock de useMediaQuery et tape-le en vitest.Mock
const mockedUseMediaQuery = mui.useMediaQuery as unknown as Mock;

describe('Footer component', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders all links with correct labels on desktop', () => {
    mockedUseMediaQuery.mockReturnValue(false); // desktop
    render(<Footer />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    expect(buttons[0]).toHaveTextContent('footer.contact');
    expect(buttons[3]).toHaveTextContent('footer.privacy');
    expect(screen.getByText(/© \d+ Test/)).toBeInTheDocument();
  });

  it('renders links stacked on mobile', () => {
    mockedUseMediaQuery.mockReturnValue(true); // mobile
    render(<Footer />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });
});

