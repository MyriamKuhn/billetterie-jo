import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/email/resend',
  '/api/auth/password/forgot',
  '/api/auth/password/reset',
];

function getPathnameFromConfig(config: any): string {
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

function handle401() {
  const authStore = useAuthStore.getState();
  authStore.clearToken();
  // Si vous gérez un flag sessionExpired, vous pouvez l’activer ici
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

function handle403() {
  if (window.location.pathname !== '/unauthorized') {
    window.location.href = '/unauthorized';
  }
}

axios.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const config = error.config;
    const path = getPathnameFromConfig(config);

    if (status === 401) {
      // Si path est un endpoint public, ne pas rediriger automatiquement
      const isPublic = PUBLIC_PATHS.some(prefix => path.startsWith(prefix));
      if (!isPublic) {
        handle401();
      }
      // Sinon, on laisse le code appelant gérer l’erreur (ex.: afficher "identifiants incorrects")
    } else if (status === 403) {
      // Redirige vers /unauthorized
      handle403();
    }
    return Promise.reject(error);
  }
);

