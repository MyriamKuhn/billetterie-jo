import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material';

// Mock ActiveLink as a plain <a> element for routing
vi.mock('../ActiveLink', () => ({
  __esModule: true,
  default: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

import ActiveButton from './ActiveButton';

// Wrap UI in MUI ThemeProvider to apply styles/classes
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

describe('<ActiveButton />', () => {
  it('renders a link with correct href and children', () => {
    renderWithTheme(
      <ActiveButton to="/mon-chemin">Clique ici</ActiveButton>
    );

    const link = screen.getByRole('link', { name: 'Clique ici' });
    expect(link).toHaveAttribute('href', '/mon-chemin');
    expect(link).toHaveTextContent('Clique ici');
  });

  it('forwards MUI props (disabled, data-testid)', () => {
    renderWithTheme(
      <ActiveButton to="/x" disabled data-testid="btn">
        Test
      </ActiveButton>
    );

    const link = screen.getByRole('link', { name: 'Test' });
    // MUI Button adds aria-disabled on a link when disabled
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('data-testid', 'btn');
  });

  it('applies variant="outlined" and color="primary" classes', () => {
    renderWithTheme(
      <ActiveButton to="/y">Hello</ActiveButton>
    );

    const link = screen.getByRole('link', { name: 'Hello' });
    expect(link.className).toMatch(/MuiButton-outlined/);
    expect(link.className).toMatch(/MuiButton-colorPrimary/);
  });
});
