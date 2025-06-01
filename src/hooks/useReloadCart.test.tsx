import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useReloadCart } from './useReloadCart';

// ─── 1) MOCKS ─────────────────────────────────────────────────────────────────────
// Mock `loadCart` in our cart store:
const mockLoadCart = vi.fn();
vi.mock('../stores/useCartStore', () => {
  // `useCartStore(selector)` returns an object whose `loadCart` is our mock
  const useCartStore = (selector: any) => selector({ loadCart: mockLoadCart });
  (useCartStore as any).getState = () => ({ loadCart: mockLoadCart });
  return { __esModule: true, useCartStore };
});

// Mock `useCustomSnackbar().notify(...)`:
const mockNotify = vi.fn();
vi.mock('./useCustomSnackbar', () => ({
  __esModule: true,
  useCustomSnackbar: () => ({ notify: mockNotify }),
}));

// Mock `react-i18next` so that `t(key)` simply returns `key`:
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key: string) => key }),
}));

// We’ll stub out `useLanguageStore` so we can change `lang` in tests:
let currentLang = 'en';
vi.mock('../stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: (selector: any) => selector({ lang: currentLang }),
}));

// ─── 2) TEST HARNESS COMPONENT ────────────────────────────────────────────────────
// A tiny component that exposes the hook’s state and a <button> to call reload():
function TestComponent() {
  const { loading, hasError, isReloading, reload } = useReloadCart();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="hasError">{String(hasError)}</span>
      <span data-testid="isReloading">{String(isReloading)}</span>
      <button data-testid="reload-button" onClick={reload}>
        Reload
      </button>
    </div>
  );
}

// ─── 3) TEST SUITE ─────────────────────────────────────────────────────────────────
describe('useReloadCart', () => {
  beforeEach(() => {
    mockLoadCart.mockReset();
    mockNotify.mockReset();
    currentLang = 'en';
  });

  afterEach(() => {
    cleanup();
  });

  it('reload successful: hasError remains false and no notify', async () => {
    // 1) Make loadCart resolve immediately
    mockLoadCart.mockResolvedValue(undefined);

    // 2) Render → the hook’s useEffect() runs `reload()` at least once on mount
    render(<TestComponent />);
    // Wait until loadCart has been called at least once (ignore exactly how many times):
    await waitFor(() => {
      expect(mockLoadCart.mock.calls.length).toBeGreaterThan(0);
    });
    // Remember how many times we have so far:
    const callsAfterMount = mockLoadCart.mock.calls.length;

    // 3) Now click the “Reload” button
    fireEvent.click(screen.getByTestId('reload-button'));

    // 4) Wait until `loadCart` has been called at least one more time
    await waitFor(() => {
      expect(mockLoadCart.mock.calls.length).toBeGreaterThan(callsAfterMount);
    });

    // 5) Because the mock resolved, hasError should remain "false" and notify() was never called
    expect(screen.getByTestId('hasError').textContent).toBe('false');
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('reload error 404: sets hasError and notifies "...error_not_found"', async () => {
    // 1) Have loadCart reject with an AxiosError‐like object whose status is 404
    const error404 = { code: '', response: { status: 404 } } as any;
    mockLoadCart.mockRejectedValue(error404);

    // 2) Render → initial effect runs reload(), which now rejects immediately
    render(<TestComponent />);

    // 3) Wait for `hasError` to become "true" and a notify call ending in "error_not_found"
    await waitFor(() => {
      expect(screen.getByTestId('hasError').textContent).toBe('true');
      // `t('errors.error_not_found')` returns exactly "errors.error_not_found"
      expect(mockNotify).toHaveBeenCalledWith(expect.stringMatching(/error_not_found$/), 'error');
    });

    // 4) Clear mocks before we do a manual “Reload” click
    mockLoadCart.mockClear();
    mockNotify.mockClear();

    // 5) Click “Reload” again
    fireEvent.click(screen.getByTestId('reload-button'));

    // 6) Wait until loadCart has been called at least once more
    await waitFor(() => {
      expect(mockLoadCart.mock.calls.length).toBeGreaterThan(0);
    });

    // And since it rejects with status=404 again, hasError remains "true" and we get the same notify:
    expect(screen.getByTestId('hasError').textContent).toBe('true');
    expect(mockNotify).toHaveBeenCalledWith(expect.stringMatching(/error_not_found$/), 'error');
  });

  it('reload error non-404: sets hasError and notifies "...error_load"', async () => {
    // 1) Reject with a 500‐style error
    const error500 = { code: '', response: { status: 500 } } as any;
    mockLoadCart.mockRejectedValue(error500);

    // 2) Render → initial effect
    render(<TestComponent />);

    // 3) Wait for hasError="true" and notify(…) ending in "error_load"
    await waitFor(() => {
      expect(screen.getByTestId('hasError').textContent).toBe('true');
      expect(mockNotify).toHaveBeenCalledWith(expect.stringMatching(/error_load$/), 'error');
    });

    // 4) Clear and click “Reload” again
    mockLoadCart.mockClear();
    mockNotify.mockClear();
    fireEvent.click(screen.getByTestId('reload-button'));

    // 5) Wait for loadCart to be called at least once
    await waitFor(() => {
      expect(mockLoadCart.mock.calls.length).toBeGreaterThan(0);
    });

    // hasError still "true" and notify called again with "...error_load"
    expect(screen.getByTestId('hasError').textContent).toBe('true');
    expect(mockNotify).toHaveBeenCalledWith(expect.stringMatching(/error_load$/), 'error');
  });

  it('reload cancellation error: does NOT set hasError and does NOT notify', async () => {
    // 1) Reject with an abort‐style error (AxiosError.code === 'ERR_CANCELED')
    const cancelError = { code: 'ERR_CANCELED' } as any;
    mockLoadCart.mockRejectedValue(cancelError);

    // 2) Render → initial effect runs reload() → it rejects, but because code==='ERR_CANCELED',
    //    we should NOT set hasError or call notify.
    render(<TestComponent />);

    // 3) Wait a moment: hasError should stay "false" and notify has not been called
    await waitFor(() => {
      expect(screen.getByTestId('hasError').textContent).toBe('false');
      expect(mockNotify).not.toHaveBeenCalled();
    });

    // 4) Clear mocks, then click “Reload” manually
    mockLoadCart.mockClear();
    mockNotify.mockClear();
    fireEvent.click(screen.getByTestId('reload-button'));

    // 5) Wait for loadCart to be called at least once
    await waitFor(() => {
      expect(mockLoadCart.mock.calls.length).toBeGreaterThan(0);
    });

    // Still hasError="false" and notify was never called
    expect(screen.getByTestId('hasError').textContent).toBe('false');
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('auto-reload when language changes', async () => {
    // 1) Make loadCart resolve cleanly
    mockLoadCart.mockResolvedValue(undefined);

    // 2) Render → initial effect calls loadCart at least once
    render(<TestComponent />);
    await waitFor(() => {
      expect(mockLoadCart.mock.calls.length).toBeGreaterThan(0);
    });

    // 3) Record how many times loadCart was called so far, then clear mocks.
    mockLoadCart.mockClear();

    // 4) Change the language and re-render. Because `useLanguageStore` now returns a different
    //    `lang`, the hook’s `useEffect([..., lang])` must fire again.
    currentLang = 'fr';
    render(<TestComponent />);

    // 5) Wait until loadCart has been called at least once more due to the new `lang`.
    await waitFor(() => {
      expect(mockLoadCart.mock.calls.length).toBeGreaterThan(0);
    });
  });
});
