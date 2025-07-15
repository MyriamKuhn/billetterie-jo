import { useLocation } from 'react-router-dom';

/**
 * Returns the current URL pathname.
 *
 * This wrapper exists so that in tests you can mock this module
 * rather than having to stub react-router-dom directly.
 *
 * @returns The current location pathname (e.g. "/home", "/users/123").
 */
export function usePathname(): string {
  return useLocation().pathname;
}