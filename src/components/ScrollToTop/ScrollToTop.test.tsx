// src/components/ScrollToTop/ScrollToTop.test.tsx
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ① Mock *only* your utility; tests never touch react-router-dom
vi.mock('../../utils/getPathname', () => ({
  usePathname: vi.fn(),
}));

import ScrollToTop from './ScrollToTop';
import { usePathname } from '../../utils/getPathname';

describe('<ScrollToTop />', () => {
  let scrollSpy: ReturnType<typeof vi.spyOn>;
  const mockedUsePathname = usePathname as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cleanup();
    // intercept window.scrollTo
    scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing and scrolls once on mount', () => {
    mockedUsePathname.mockReturnValue('/initial');
    const { container } = render(<ScrollToTop />);
    expect(container.firstChild).toBeNull();
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  });

  it('re-scrolls when the pathname changes', () => {
    // first render
    mockedUsePathname.mockReturnValue('/foo');
    const { rerender } = render(<ScrollToTop />);
    expect(scrollSpy).toHaveBeenCalledTimes(1);

    // simulate location change
    mockedUsePathname.mockReturnValue('/bar');
    rerender(<ScrollToTop />);
    expect(scrollSpy).toHaveBeenCalledTimes(2);
    expect(scrollSpy).toHaveBeenLastCalledWith({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  });
});
