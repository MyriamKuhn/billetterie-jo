import { describe, it, expect } from 'vitest';
import { getTicketStatusChipColor } from './ticket';

describe('getTicketStatusChipColor', () => {
  it('doit renvoyer "success" pour le statut "used"', () => {
    expect(getTicketStatusChipColor('used')).toBe('success');
  });

  it('doit renvoyer "info" pour le statut "issued"', () => {
    expect(getTicketStatusChipColor('issued')).toBe('info');
  });

  it('doit renvoyer "warning" pour le statut "refunded"', () => {
    expect(getTicketStatusChipColor('refunded')).toBe('warning');
  });

  it('doit renvoyer "error" pour le statut "cancelled"', () => {
    expect(getTicketStatusChipColor('cancelled')).toBe('error');
  });

  it('doit renvoyer "default" pour un statut inconnu', () => {
    expect(getTicketStatusChipColor('whatever')).toBe('default');
    expect(getTicketStatusChipColor('')).toBe('default');
    expect(getTicketStatusChipColor('USED')).toBe('default');
  });
});
