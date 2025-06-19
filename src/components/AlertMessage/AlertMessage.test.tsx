import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AlertMessage from './AlertMessage';
import { createTheme, ThemeProvider } from '@mui/material/styles';

function renderWithTheme(ui: React.ReactElement) {
  const theme = createTheme();
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('AlertMessage component', () => {
  it('renders error message with correct color and role', () => {
    render(<AlertMessage message="Something went wrong" severity="error" />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Something went wrong');

    // MUI applies theme color; error maps to theme.palette.error.main (rgb(211,47,47))
    expect(alert).toHaveStyle({ color: 'rgb(211, 47, 47)' });
  });

  it('renders success message with role="status" and with success color', () => {
    render(<AlertMessage message="Operation successful" severity="success" />);

    // on attend un rôle status pour success
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('Operation successful');

    // success.main maps to rgb(46,125,50)
    expect(status).toHaveStyle({ color: 'rgb(46, 125, 50)' });
  });

  it('renders info message with role="status" et avec couleur info', () => {
    render(<AlertMessage message="Info message" severity="info" />);
    // on attend aussi role="status" pour info
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('Info message');

    // couleur selon theme.palette.info.main, par exemple rgb(2,136,209)
    expect(status).toHaveStyle({ color: 'rgb(2, 136, 209)' });
  });
});

describe('AlertMessage default branch', () => {
  it('renders default case (severity invalide) with text.primary color and role="status"', () => {
    // On force un severity invalide pour atteindre le default
    renderWithTheme(<AlertMessage message="Default message" severity={'' as any} />);
    // Le rôle reste 'status' car severity !== 'error'
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('Default message');

    // text.primary par défaut du thème MUI : rgba(0, 0, 0, 0.87)
    expect(status).toHaveStyle({ color: 'rgba(0, 0, 0, 0.87)' });
  });
});