import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Mock NavLink from react-router-dom as a plain <a> for testing
vi.mock('react-router-dom', () => ({
  __esModule: true,
  NavLink: ({ to, children, className, ...props }: any) => (
    <a data-testid="link" href={to} className={className} {...props}>
      {children}
    </a>
  ),
}));

import ActiveLink from './ActiveLink';

// Wrap components in ThemeProvider so styled-components get theme context
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

describe('<ActiveLink />', () => {
  it('renders a link with correct href and content', () => {
    renderWithTheme(<ActiveLink to="/about">À propos</ActiveLink>);
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', '/about');
    expect(link).toHaveTextContent('À propos');
  });

  it('forwards extra props to the <a>', () => {
    renderWithTheme(
      <ActiveLink to="/foo" id="my-link" title="Mon lien">
        Foo
      </ActiveLink>
    );
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('id', 'my-link');
    expect(link).toHaveAttribute('title', 'Mon lien');
  });

  it('applies "active" class when passed via className', () => {
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
