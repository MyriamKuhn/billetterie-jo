import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1) Mocks avant d'importer votre composant
vi.mock('@mui/material/IconButton', () => ({
  __esModule: true,
  default: ({ children, onClick, 'aria-label': ariaLabel }: any) => (
    <button
      data-testid="icon-button"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}));
vi.mock('@mui/icons-material/DarkMode', () => ({
  __esModule: true,
  default: () => <span data-testid="icon-dark" />,
}));
vi.mock('@mui/icons-material/LightMode', () => ({
  __esModule: true,
  default: () => <span data-testid="icon-light" />,
}));

// 2) Puis votre composant
import ThemeToggle from './ThemeToggle';

describe('<ThemeToggle />', () => {
  const toggleModeMock = vi.fn();

  beforeEach(() => {
    cleanup();
    toggleModeMock.mockClear();
  });

  it('affiche l’icône DarkMode et label pour activer sombre', () => {
    render(<ThemeToggle mode="light" toggleMode={toggleModeMock} />);
    const btn = screen.getByTestId('icon-button');
    expect(btn).toHaveAttribute('aria-label', 'Activer le mode sombre');
    expect(screen.getByTestId('icon-dark')).toBeInTheDocument();
  });

  it('affiche l’icône LightMode et label pour activer clair', () => {
    render(<ThemeToggle mode="dark" toggleMode={toggleModeMock} />);
    const btn = screen.getByTestId('icon-button');
    expect(btn).toHaveAttribute('aria-label', 'Activer le mode clair');
    expect(screen.getByTestId('icon-light')).toBeInTheDocument();
  });

  it('appelle toggleMode au clic', () => {
    render(<ThemeToggle mode="light" toggleMode={toggleModeMock} />);
    const btn = screen.getByTestId('icon-button');
    fireEvent.click(btn);
    expect(toggleModeMock).toHaveBeenCalled();
  });
});
