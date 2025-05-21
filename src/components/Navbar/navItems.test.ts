// src/components/Navbar/navItems.test.ts
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
  it('doit contenir deux items avec les bonnes clés, href et icônes', () => {
    expect(navItems).toHaveLength(2);

    expect(navItems[0]).toEqual({
      key: 'home',
      href: '/',
      icon: 'HomeIcon',
    });

    expect(navItems[1]).toEqual({
      key: 'tickets',
      href: '/tickets',
      icon: 'TicketIcon',
    });
  });
});
