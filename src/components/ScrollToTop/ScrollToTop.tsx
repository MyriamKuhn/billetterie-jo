import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Jump direct en haut de la page
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;