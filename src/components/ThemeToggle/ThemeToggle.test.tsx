import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ❶ Stub @mui/material IconButton
vi.mock('@mui/material', () => ({
  __esModule: true,
  IconButton: ({ children, onClick, 'aria-label': ariaLabel }: any) => (
    <button
      data-testid="icon-button"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}));

// ❷ Stub @mui/icons-material icons
vi.mock('@mui/icons-material', () => ({
  __esModule: true,
  DarkMode: () => <span data-testid="icon-dark" />,
  LightMode: () => <span data-testid="icon-light" />,
}));

// ❸ Import du composant APRÈS les mocks
import { ThemeToggle } from './ThemeToggle';

describe('<ThemeToggle />', () => {
  const toggleModeMock = vi.fn();

  beforeEach(() => {
    cleanup();
    toggleModeMock.mockClear();
  });

  it('en mode light affiche l’icône DarkMode et label pour activer sombre', () => {
    render(<ThemeToggle mode="light" toggleMode={toggleModeMock} />);

    const btn = screen.getByTestId('icon-button');
    expect(btn).toHaveAttribute('aria-label', 'Activer le mode sombre');

    // Vérifie que c’est l’icône DarkMode stub
    expect(screen.getByTestId('icon-dark')).toBeInTheDocument();
  });

  it('en mode dark affiche l’icône LightMode et label pour activer clair', () => {
    render(<ThemeToggle mode="dark" toggleMode={toggleModeMock} />);

    const btn = screen.getByTestId('icon-button');
    expect(btn).toHaveAttribute('aria-label', 'Activer le mode clair');

    // Vérifie que c’est l’icône LightMode stub
    expect(screen.getByTestId('icon-light')).toBeInTheDocument();
  });

  it('appelle toggleMode au clic', () => {
    render(<ThemeToggle mode="light" toggleMode={toggleModeMock} />);

    const btn = screen.getByTestId('icon-button');
    fireEvent.click(btn);
    expect(toggleModeMock).toHaveBeenCalled();
  });
});
