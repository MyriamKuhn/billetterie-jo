import { describe, it, expect, vi } from 'vitest';

// ❶ On mocke les icônes pour retourner des chaînes uniques
vi.mock('@mui/icons-material/Home', () => ({
  __esModule: true,
  default: 'HomeIcon',
}));
vi.mock('@mui/icons-material/ConfirmationNumber', () => ({
  __esModule: true,
  default: 'TicketIcon',
}));

// ❷ On importe après les mocks
import { navItems } from './navItems';

describe('navItems', () => {
  it('doit contenir deux items publics avec les bonnes clés, href et icônes', () => {
    const publicItems = navItems.filter(item => item.group === 'public');
    expect(publicItems).toHaveLength(2);

    expect(publicItems[0]).toMatchObject({
      key: 'home',
      href: '/',
      icon: 'HomeIcon',
    });

    expect(publicItems[1]).toMatchObject({
      key: 'tickets',
      href: '/tickets',
      icon: 'TicketIcon',
    });
  });

  it('chaque item doit avoir les propriétés requises', () => {
    navItems.forEach(item => {
      expect(item).toHaveProperty('key');
      expect(item).toHaveProperty('icon');
      expect(item).toHaveProperty('group');
      // href est obligatoire pour tous sauf logout
      if (item.group !== 'logout') {
        expect(item).toHaveProperty('href');
        expect(typeof item.href).toBe('string');
      }
      expect(['public', 'login', 'password', 'dashboard', 'auth', 'logout']).toContain(item.group);
    });
  });

  it('vérifie les rôles et auth flags', () => {
    navItems.forEach(item => {
      if (item.auth) {
        expect(['admin', 'employee', 'user', 'all']).toContain(item.role);
      } else {
        expect(item.role).toBe('all');
      }
    });
  });

  it('décompte total correspond aux éléments déclarés', () => {
    expect(navItems).toHaveLength(19);
  });
});

