import React, { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CustomSnackbar, type CustomSnackbarProps } from './CustomSnackbar';

function renderWithTheme(props: CustomSnackbarProps & { ref?: React.Ref<HTMLDivElement> }) {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      <CustomSnackbar {...props} ref={props.ref} />
    </ThemeProvider>
  );
}

// Helper to convert hex to rgb(...) string
function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

describe('<CustomSnackbar />', () => {
  it('renders the message text', () => {
    const onClose = vi.fn();
    renderWithTheme({ message: 'Test message', severity: 'info', onClose });

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('applies the correct backgroundColor for each severity', () => {
    const onClose = vi.fn();
    const theme = createTheme();

    (['success', 'info', 'warning', 'error'] as const).forEach((severity) => {
      const { container, unmount } = renderWithTheme({
        message: `Severity ${severity}`,
        severity,
        onClose,
      });

      const snackbarDiv = container.querySelector('.MuiSnackbarContent-root') as HTMLElement;
      expect(snackbarDiv).toBeTruthy();

      // Expected background in rgb format
      const expectedBgRgb = hexToRgb(theme.palette[severity].main);

      // Inline style holds the RGB value
      expect(snackbarDiv.style.backgroundColor).toBe(expectedBgRgb);

      unmount();
    });
  });

  it('forwards ref to the root element', () => {
    const onClose = vi.fn();
    const ref = createRef<HTMLDivElement>();

    renderWithTheme({ message: 'Ref test', severity: 'info', onClose, ref });

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toContainElement(screen.getByText('Ref test'));
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    renderWithTheme({ message: 'Close test', severity: 'warning', onClose });

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
