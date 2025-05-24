import { useLocation } from 'react-router-dom';

/**
 * In real code, this just returns useLocation().pathname.
 * In tests, we’ll mock this module instead of touching react-router-dom.
 */
export function usePathname(): string {
  return useLocation().pathname;
}