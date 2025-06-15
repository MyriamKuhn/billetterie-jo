// RequireAuth.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, beforeEach, vi, type Mock } from 'vitest';

// Mock de useAuthStore
import { useAuthStore } from '../../stores/useAuthStore';
vi.mock('../../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

// Import du composant à tester
import { RequireAuth } from './RequireAuth';

// Import éventuel de UserRole pour les casts ou valeurs valides
import type { UserRole } from '../../stores/useAuthStore';

describe('<RequireAuth />', () => {
  let mockToken: string | null;
  let mockRole: UserRole | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: any) => any) => {
      const state = {
        authToken: mockToken,
        role: mockRole,
      };
      return selector(state);
    });
  });

  function renderWithRoutes(initialEntries: string[], element: React.ReactNode) {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          {/* Route protégée */}
          <Route path="/protected" element={element} />
          {/* Page de login */}
          <Route path="/login" element={<div>LoginPage</div>} />
          {/* Page unauthorized */}
          <Route path="/unauthorized" element={<div>UnauthorizedPage</div>} />
          {/* Routes pour tests personnalisés */}
          <Route path="/signin" element={<div>SigninPage</div>} />
          <Route path="/noaccess" element={<div>NoAccessPage</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('redirige vers /login si non authentifié', async () => {
    mockToken = null;
    mockRole = undefined;

    const protectedElement = <RequireAuth><div>ProtectedContent</div></RequireAuth>;

    renderWithRoutes(['/protected'], protectedElement);

    await waitFor(() => {
      expect(screen.getByText('LoginPage')).toBeInTheDocument();
    });
  });

  it('rend les children si authentifié et pas de requiredRole', async () => {
    mockToken = 'valid-token';
    // Choisissez un rôle valide existant; par exemple 'user'
    mockRole = 'user';

    const protectedElement = <RequireAuth><div>ProtectedContent</div></RequireAuth>;

    renderWithRoutes(['/protected'], protectedElement);

    await waitFor(() => {
      expect(screen.getByText('ProtectedContent')).toBeInTheDocument();
    });
  });

  it('redirige vers /unauthorized si authentifié mais rôle incorrect', async () => {
    mockToken = 'valid-token';
    // Rôle simulé, par exemple 'user'
    mockRole = 'user';
    // requiredRole différent, par exemple 'admin'
    const requiredRole: UserRole = 'admin';

    const protectedElement = (
      <RequireAuth requiredRole={requiredRole}>
        <div>AdminContent</div>
      </RequireAuth>
    );

    renderWithRoutes(['/protected'], protectedElement);

    await waitFor(() => {
      expect(screen.getByText('UnauthorizedPage')).toBeInTheDocument();
    });
  });

  it('rend les children si authentifié et rôle correct', async () => {
    mockToken = 'valid-token';
    // Rôle simulé
    mockRole = 'admin';
    const requiredRole: UserRole = 'admin';

    const protectedElement = (
      <RequireAuth requiredRole={requiredRole}>
        <div>AdminContent</div>
      </RequireAuth>
    );

    renderWithRoutes(['/protected'], protectedElement);

    await waitFor(() => {
      expect(screen.getByText('AdminContent')).toBeInTheDocument();
    });
  });

  it('utilise loginPath personnalisé', async () => {
    mockToken = null;
    mockRole = undefined;

    const protectedElement = (
      <RequireAuth loginPath="/signin">
        <div>ProtectedContent</div>
      </RequireAuth>
    );

    renderWithRoutes(['/protected'], protectedElement);

    await waitFor(() => {
      expect(screen.getByText('SigninPage')).toBeInTheDocument();
    });
  });

  it('utilise unauthorizedPath personnalisé', async () => {
    mockToken = 'valid-token';
    mockRole = 'user';
    // requiredRole différent
    const requiredRole: UserRole = 'admin';
    // unauthorizedPath personnalisé
    const unauthorizedPath = '/noaccess';

    const protectedElement = (
      <RequireAuth requiredRole={requiredRole} unauthorizedPath={unauthorizedPath}>
        <div>AdminContent</div>
      </RequireAuth>
    );

    renderWithRoutes(['/protected'], protectedElement);

    await waitFor(() => {
      expect(screen.getByText('NoAccessPage')).toBeInTheDocument();
    });
  });
});

