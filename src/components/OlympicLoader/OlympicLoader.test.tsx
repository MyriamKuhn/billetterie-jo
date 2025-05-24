import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ❶ Mock de Box pour récupérer le prop sx
vi.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ sx, children }: any) => (
    <div data-testid="box" data-sx={JSON.stringify(sx)}>
      {children}
    </div>
  ),
}));

// ❷ Import du composant APRÈS le mock
import OlympicLoader from './OlympicLoader';

describe('<OlympicLoader />', () => {
  beforeEach(() => {
    // Nettoyage du DOM
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('transmet bien les props sx au Box', () => {
    render(<OlympicLoader />);

    const box = screen.getByTestId('box');
    expect(box).toBeInTheDocument();

    // On parse le JSON du sx
    const sx = JSON.parse(box.getAttribute('data-sx')!);

    // Vérifie les clés principales
    expect(sx).toMatchObject({
      display: 'inline-block',
      width: 160,
      height: 84,
    });

    // L’animation doit contenir la durée et le timing-function
    expect(typeof sx.animation).toBe('string');
    expect(sx.animation).toContain('1.5s');
    expect(sx.animation).toContain('ease-in-out');
    expect(sx.animation).toContain('infinite');
  });

  it('rend un SVG avec le bon viewBox', () => {
    render(<OlympicLoader />);

    const svg = document.querySelector('svg')!;
    expect(svg).toBeInTheDocument();
    expect(svg.getAttribute('viewBox')).toBe('0 0 230 120');
    // width et height à 100%
    expect(svg.getAttribute('width')).toBe('100%');
    expect(svg.getAttribute('height')).toBe('100%');
  });

  it('contient exactement 5 cercles avec les bons attributs', () => {
    render(<OlympicLoader />);

    const circles = document.querySelectorAll('circle');
    expect(circles).toHaveLength(5);

    // Vérifie un circle du haut, un du bas
    const first = circles[0]!;
    expect(first.getAttribute('cx')).toBe('50');
    expect(first.getAttribute('cy')).toBe('50');
    expect(first.getAttribute('r')).toBe('30');
    expect(first.getAttribute('stroke')).toBe('#0072CE');
    expect(first.getAttribute('fill')).toBe('none');

    const last = circles[4]!;
    expect(last.getAttribute('cx')).toBe('140');
    expect(last.getAttribute('cy')).toBe('85');
    expect(last.getAttribute('stroke')).toBe('#00A651');
  });
});
