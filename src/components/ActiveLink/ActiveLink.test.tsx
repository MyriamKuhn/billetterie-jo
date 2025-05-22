import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// 1) Mock react-router-dom.NavLink pour qu’il devienne un <a data-testid="link" ...>
vi.mock('react-router-dom', () => ({
  __esModule: true,
  NavLink: ({ to, children, className, ...props }: any) => (
    <a data-testid="link" href={to} className={className} {...props}>
      {children}
    </a>
  ),
}));

import ActiveLink from './ActiveLink';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

describe('<ActiveLink />', () => {
  it('rend un lien avec le bon href et le bon contenu', () => {
    renderWithTheme(<ActiveLink to="/about">À propos</ActiveLink>);
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', '/about');
    expect(link).toHaveTextContent('À propos');
  });

  it('transmet les props additionnelles au <a>', () => {
    renderWithTheme(
      <ActiveLink to="/foo" id="my-link" title="Mon lien">
        Foo
      </ActiveLink>
    );
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('id', 'my-link');
    expect(link).toHaveAttribute('title', 'Mon lien');
  });

  it('ajoute la classe "active" quand on la passe via className', () => {
    renderWithTheme(
      <ActiveLink to="/bar" className="active special">
        Bar
      </ActiveLink>
    );
    const link = screen.getByTestId('link');
    expect(link).toHaveClass('active');
    expect(link).toHaveClass('special');
  });
});
