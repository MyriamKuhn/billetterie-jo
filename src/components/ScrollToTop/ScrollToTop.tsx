import { useEffect } from 'react';
import { usePathname } from '../../utils/getPathname';

interface ScrollToTopProps {
  /**
   * Permet d’injecter un pathname en test, sans React Router.
   */
  forcedPath?: string;
}

function ScrollToTop({ forcedPath }: ScrollToTopProps) {
  const realPath = forcedPath ?? usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [realPath]);

  return null;
}

export default ScrollToTop;