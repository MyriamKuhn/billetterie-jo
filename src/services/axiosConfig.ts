import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

// Endpoints that don’t require auth-based redirects
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/email/resend',
  '/api/auth/password/forgot',
  '/api/auth/password/reset',
];

/**
 * Extracts the request pathname from an axios config object.
 */
export function getPathnameFromConfig(config: any): string {
  const url = config.url ?? '';
  const base = config.baseURL;
  try {
    let fullUrl: URL;
    if (/^https?:\/\//i.test(url)) {
      fullUrl = new URL(url);
    } else if (base) {
      fullUrl = new URL(url, base);
    } else {
      return url.split('?')[0];
    }
    return fullUrl.pathname;
  } catch {
    return url.split('?')[0];
  }
}

/** Clear auth and redirect to login on 401 */
function handle401() {
  const authStore = useAuthStore.getState();
  authStore.clearToken();
  // Si vous gérez un flag sessionExpired, vous pouvez l’activer ici
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

/** Redirect to unauthorized page on 403 */
function handle403() {
  if (window.location.pathname !== '/unauthorized') {
    window.location.href = '/unauthorized';
  }
}

// Attach a response interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const config = error.config;
    const path = getPathnameFromConfig(config);

    if (status === 401) {
      // Only auto-redirect if not a public endpoint
      const isPublic = PUBLIC_PATHS.some(prefix => path.startsWith(prefix));
      if (!isPublic) {
        handle401();
      }
    } else if (status === 403) {
      handle403();
    }
    return Promise.reject(error);
  }
);

