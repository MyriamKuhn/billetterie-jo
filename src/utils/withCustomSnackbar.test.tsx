import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── 1) MOCK CUSTOMSNACKBAR COMPONENT ────────────────────────────────────────
vi.mock('../components/CustomSnackbar', () => ({
  __esModule: true,
  CustomSnackbar: ({ message, severity, onClose }: any) => (
    <div
      data-testid="custom-snackbar"
      data-message={message}
      data-severity={severity}
      onClick={onClose}
    />
  ),
}));

// ─── 2) IMPORT THE FUNCTION UNDER TEST ──────────────────────────────────────
import { withCustomSnackbar } from './withCustomSnackbar';

describe('withCustomSnackbar', () => {
  let closeSnackbarMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    closeSnackbarMock = vi.fn();
  });

  it('returns a renderer that wraps message string and severity correctly', () => {
    const variant: any = 'success';
    const key = 42;
    const message = 'Hello World';

    const renderContent = withCustomSnackbar(variant, closeSnackbarMock);
    const element = renderContent(key, message);

    render(<>{element}</>);

    const snackbar = screen.getByTestId('custom-snackbar');
    expect(snackbar).toHaveAttribute('data-message', 'Hello World');
    expect(snackbar).toHaveAttribute('data-severity', 'success');
  });

  it('maps "default" variant to severity "info"', () => {
    const variant: any = 'default';
    const key = 'abc';
    const message = 'Test Default';

    const renderContent = withCustomSnackbar(variant, closeSnackbarMock);
    render(<>{renderContent(key, message)}</>);

    const snackbar = screen.getByTestId('custom-snackbar');
    expect(snackbar).toHaveAttribute('data-severity', 'info');
    expect(snackbar).toHaveAttribute('data-message', 'Test Default');
  });

  it('converts non-string messages to string', () => {
    const variant: any = 'warning';
    const key = 7;
    const message = 12345; // number

    const renderContent = withCustomSnackbar(variant, closeSnackbarMock);
    render(<>{renderContent(key, message)}</>);

    const snackbar = screen.getByTestId('custom-snackbar');
    expect(snackbar).toHaveAttribute('data-message', '12345');
    expect(snackbar).toHaveAttribute('data-severity', 'warning');
  });

  it('invokes closeSnackbar with the correct key when onClose is called', () => {
    const variant: any = 'error';
    const key = 'xyz';
    const message = 'Error occurred';

    const renderContent = withCustomSnackbar(variant, closeSnackbarMock);
    render(<>{renderContent(key, message)}</>);

    const snackbar = screen.getByTestId('custom-snackbar');
    fireEvent.click(snackbar);
    expect(closeSnackbarMock).toHaveBeenCalledOnce();
    expect(closeSnackbarMock).toHaveBeenCalledWith(key);
  });
});
