// src/components/PageWrapper/PageWrapper.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// ❶ Mock @mui/material/Container
vi.mock('@mui/material/Container', () => ({
  __esModule: true,
  default: ({ children, maxWidth, sx }: any) => (
    <div
      data-testid="container"
      data-maxwidth={maxWidth}
      data-sx={JSON.stringify(sx)}
    >
      {children}
    </div>
  ),
}));

// ❷ Mock @mui/material/Card
vi.mock('@mui/material/Card', () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <section data-testid="card">{children}</section>
  ),
}));

// ❸ Import du composant APRÈS les mocks
import { PageWrapper } from './PageWrapper';

describe('<PageWrapper />', () => {
  it('rend ses enfants dans un Card imbriqué dans un Container quand disableCard=false (par défaut)', () => {
    render(
      <PageWrapper>
        <span data-testid="child">Mon contenu</span>
      </PageWrapper>
    );

    // Vérifie le Container et ses props
    const container = screen.getByTestId('container');
    expect(container).toHaveAttribute('data-maxwidth', 'lg');
    expect(container).toHaveAttribute('data-sx', JSON.stringify({ py: 4 }));

    // Vérifie la présence du Card
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();

    // Les enfants sont rendus à l’intérieur du Card
    const child = screen.getByTestId('child');
    expect(child).toHaveTextContent('Mon contenu');
    expect(container).toContainElement(card);
    expect(card).toContainElement(child);
  });

  it('rend directement ses enfants dans le Container quand disableCard=true', () => {
    render(
      <PageWrapper disableCard>
        <span data-testid="child-no-card">Autre contenu</span>
      </PageWrapper>
    );

    // Toujours un Container avec les mêmes props
    const container = screen.getByTestId('container');
    expect(container).toHaveAttribute('data-maxwidth', 'lg');
    expect(container).toHaveAttribute('data-sx', JSON.stringify({ py: 4 }));

    // Le Card ne doit pas exister
    expect(screen.queryByTestId('card')).toBeNull();

    // Les enfants sont rendus directement dans le Container
    const childNoCard = screen.getByTestId('child-no-card');
    expect(childNoCard).toHaveTextContent('Autre contenu');
    expect(container).toContainElement(childNoCard);
  });
});
