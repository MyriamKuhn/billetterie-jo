import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop:
 * Uses a layout effect to immediately scroll the window to the top (0,0)
 * whenever the location pathname changes, ensuring that each new page
 * starts at the top instead of retaining the previous scroll position.
 */
function ScrollToTop() {
  const { pathname } = useLocation(); // Get the current route path

  useLayoutEffect(() => {
    window.scrollTo(0, 0);  // Instantly jump to top-left corner
  }, [pathname]); // Re-run on every path change

  return null;  // This component does not render any UI
}

export default ScrollToTop;