import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../../stores/useAuthStore';
import type { JSX } from 'react';

interface RequireAuthProps {
  children: JSX.Element;
  requiredRole?: UserRole;
  loginPath?: string;
  unauthorizedPath?: string;
}

export function RequireAuth({
  children,
  requiredRole,
  loginPath = '/login',
  unauthorizedPath = '/unauthorized',
}: RequireAuthProps): JSX.Element {
  const authToken = useAuthStore(state => state.authToken);
  const role = useAuthStore(state => state.role);
  const location = useLocation();

  // 1) Vérifier si authentifié
  if (!authToken) {
    // Redirige vers login, on peut passer l’URL d’origine dans state
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 2) Si un rôle est requis, vérifier
  if (requiredRole && role !== requiredRole) {
    // Authentifié mais pas le bon rôle
    return <Navigate to={unauthorizedPath} replace />;
  }

  // 3) Tout est ok
  return children;
}
