import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../../stores/useAuthStore';
import type { JSX } from 'react';

interface RequireAuthProps {
  children: JSX.Element;
  requiredRole?: UserRole;
  loginPath?: string;
  unauthorizedPath?: string;
}

/**
 * RequireAuth:
 * - If the user is not authenticated (no authToken), redirect to the login page.
 * - If a requiredRole is specified and the user's role does not match, redirect to unauthorizedPath.
 * - Otherwise, render the children (protected content).
 */
export function RequireAuth({
  children,
  requiredRole,
  loginPath = '/login',
  unauthorizedPath = '/unauthorized',
}: RequireAuthProps): JSX.Element {
  const authToken = useAuthStore(state => state.authToken);
  const role = useAuthStore(state => state.role);
  const location = useLocation();

  // 1) Not authenticated: redirect to login with the original location in state
  if (!authToken) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 2) Authenticated but wrong role: redirect to unauthorized page
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={unauthorizedPath} replace />;
  }

  // 3) Authorized: render the protected children components
  return children;
}
