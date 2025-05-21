import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// ❶ Stub de Container et Card pour inspecter leurs props et structure
vi.mock('@mui/material', () => ({
  __esModule: true,
  Container: ({ children, maxWidth, sx }: any) => (
    <div
      data-testid="container"
      data-maxwidth={maxWidth}
      data-sx={JSON.stringify(sx)}
    >
      {children}
    </div>
  ),
  Card: ({ children }: any) => (
    <section data-testid="card">{children}</section>
  ),
}));

// ❷ Import du composant APRÈS les mocks
import { PageWrapper } from './PageWrapper';

describe('<PageWrapper />', () => {
  it('rend ses enfants à l’intérieur d’un Card imbriqué dans un Container avec les bons props', () => {
    render(
      <PageWrapper>
        <span data-testid="child">Mon contenu</span>
      </PageWrapper>
    );

    // Vérifie le Container et ses props
    const container = screen.getByTestId('container');
    expect(container).toHaveAttribute('data-maxwidth', 'lg');
    // sx === {{ py: 4 }}
    expect(container).toHaveAttribute('data-sx', JSON.stringify({ py: 4 }));

    // Vérifie le Card
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();

    // Les enfants sont rendus
    const child = screen.getByTestId('child');
    expect(child).toHaveTextContent('Mon contenu');

    // Hiérarchie : Container > Card > children
    expect(container).toContainElement(card);
    expect(card).toContainElement(child);
  });
});
