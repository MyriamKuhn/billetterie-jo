import { render } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCustomSnackbar } from './useCustomSnackbar';

// ─── Mocks ────────────────────────────────────────────────────────────────────────
// 1) Mock notistack useSnackbar
const mockEnqueue = vi.fn();
const mockClose = vi.fn();
vi.mock('notistack', () => ({
  __esModule: true,
  useSnackbar: () => ({
    enqueueSnackbar: mockEnqueue,
    closeSnackbar: mockClose,
  }),
}));

// 2) Mock withCustomSnackbar to return a predictable value
vi.mock('../utils/withCustomSnackbar', () => ({
  __esModule: true,
  withCustomSnackbar: (variant: string, _closeFn: any) => `custom-content-${variant}`,
}));

// ─── Helper to extract the notify function from the hook ─────────────────────────
function HookRunner({ onReady }: { onReady: (notify: any) => void }) {
  const { notify } = useCustomSnackbar();
  useEffect(() => {
    onReady(notify);
  }, [notify, onReady]);
  return null;
}

// ─── Tests ────────────────────────────────────────────────────────────────────────
describe('useCustomSnackbar', () => {
  beforeEach(() => {
    mockEnqueue.mockReset();
    mockClose.mockReset();
  });

  it('enqueueSnackbar avec valeurs par défaut', () => {
    let hookNotify: any = () => {};
    render(<HookRunner onReady={(fn) => (hookNotify = fn)} />);

    // Appel sans préciser variant ni duration
    hookNotify('message-test');
    expect(mockEnqueue).toHaveBeenCalledWith('message-test', {
      variant: 'default',
      autoHideDuration: 3000,
      content: 'custom-content-default',
    });
  });

  it('enqueueSnackbar avec variant et autoHideDuration personnalisés', () => {
    let hookNotify: any = () => {};
    render(<HookRunner onReady={(fn) => (hookNotify = fn)} />);

    hookNotify('warning-msg', 'warning', 5000);
    expect(mockEnqueue).toHaveBeenCalledWith('warning-msg', {
      variant: 'warning',
      autoHideDuration: 5000,
      content: 'custom-content-warning',
    });

    mockEnqueue.mockClear();

    hookNotify('error-msg', 'error', 1000);
    expect(mockEnqueue).toHaveBeenCalledWith('error-msg', {
      variant: 'error',
      autoHideDuration: 1000,
      content: 'custom-content-error',
    });
  });
});
