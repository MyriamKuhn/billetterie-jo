import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material';

// 1) Mock d’ActiveLink : un simple <a> avec href et toutes les props
vi.mock('../ActiveLink', () => ({
  __esModule: true,
  default: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

import ActiveButton from './ActiveButton';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

describe('<ActiveButton />', () => {
  it('rend un lien actif avec la bonne URL et les bons enfants', () => {
    renderWithTheme(
      <ActiveButton to="/mon-chemin">Clique ici</ActiveButton>
    );

    // on récupère l'<a> par son rôle et son libellé
    const link = screen.getByRole('link', { name: 'Clique ici' });
    expect(link).toHaveAttribute('href', '/mon-chemin');
    expect(link).toHaveTextContent('Clique ici');
  });

  it('transmet les props MUI (disabled, data-testid)', () => {
    renderWithTheme(
      <ActiveButton to="/x" disabled data-testid="btn">
        Test
      </ActiveButton>
    );

    // on récupère le lien par texte
    const link = screen.getByRole('link', { name: 'Test' });
    // MUI Button sur un <a> injecte aria-disabled="true"
    expect(link).toHaveAttribute('aria-disabled', 'true');
    // et on a bien passé data-testid
    expect(link).toHaveAttribute('data-testid', 'btn');
  });

  it('garde variant="outlined" et color="primary"', () => {
    renderWithTheme(
      <ActiveButton to="/y">Hello</ActiveButton>
    );

    const link = screen.getByRole('link', { name: 'Hello' });
    // classes MUI pour outlined + primary
    expect(link.className).toMatch(/MuiButton-outlined/);
    expect(link.className).toMatch(/MuiButton-colorPrimary/);
  });
});
