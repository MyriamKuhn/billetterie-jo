import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock React Router useLocation
vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(),
}));

import ScrollToTop from './ScrollToTop';
import { useLocation } from 'react-router-dom';

describe('<ScrollToTop />', () => {
  let scrollSpy: ReturnType<typeof vi.spyOn>;
  const mockedUseLocation = useLocation as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cleanup();
    scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing and scrolls once on mount', () => {
    mockedUseLocation.mockReturnValue({ pathname: '/initial' });
    const { container } = render(<ScrollToTop />);
    expect(container.firstChild).toBeNull();
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith(0, 0);
  });

  it('re-scrolls when the pathname changes', () => {
    // first render with /foo
    mockedUseLocation.mockReturnValue({ pathname: '/foo' });
    const { rerender } = render(<ScrollToTop />);
    expect(scrollSpy).toHaveBeenCalledTimes(1);

    // simulate location change to /bar
    mockedUseLocation.mockReturnValue({ pathname: '/bar' });
    rerender(<ScrollToTop />);
    expect(scrollSpy).toHaveBeenCalledTimes(2);
    expect(scrollSpy).toHaveBeenLastCalledWith(0, 0);
  });
});

