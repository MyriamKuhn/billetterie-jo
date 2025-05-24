import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 1️⃣ Mock react-router-dom/useLocation
vi.mock('react-router-dom', () => ({
  __esModule: true,
  useLocation: vi.fn(),
}));

import { usePathname } from './getPathname';
import * as RR from 'react-router-dom';

// 2️⃣ A tiny component to exercise the hook
function TestComponent() {
  const path = usePathname();
  return <span data-testid="path">{path}</span>;
}

describe('usePathname util', () => {
  const mockedUseLocation = RR.useLocation as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cleanup();
    mockedUseLocation.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the pathname from useLocation', () => {
    mockedUseLocation.mockReturnValue({ pathname: '/first' } as any);

    render(<TestComponent />);
    expect(screen.getByTestId('path')).toHaveTextContent('/first');
  });

  it('updates when useLocation returns a different pathname', () => {
    mockedUseLocation.mockReturnValue({ pathname: '/foo' } as any);
    const { rerender } = render(<TestComponent />);
    expect(screen.getByTestId('path')).toHaveTextContent('/foo');

    mockedUseLocation.mockReturnValue({ pathname: '/bar' } as any);
    rerender(<TestComponent />);
    expect(screen.getByTestId('path')).toHaveTextContent('/bar');
  });
});
