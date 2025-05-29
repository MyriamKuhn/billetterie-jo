import { describe, it, expect } from 'vitest';

describe('config', () => {
  it('lit VITE_API_BASE_URL depuis import.meta.env', async () => {
    // 🔧 On override l’env avant d’importer
    (import.meta.env as any).VITE_API_BASE_URL = 'https://api.test/';
    // import dynamique pour que le override soit pris en compte
    const { API_BASE_URL } = await import('./config');
    expect(API_BASE_URL).toBe('https://api.test/');
  });
});
