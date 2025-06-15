// tests/getPathnameFromConfig.test.ts
import { describe, it, expect } from 'vitest';
import { getPathnameFromConfig } from '../services/axiosConfig'; // Ajustez le chemin si besoin

describe('getPathnameFromConfig', () => {
  it('retourne la partie avant "?" si URL relative sans baseURL', () => {
    const config = { url: '/path/simple?param=1&other=2', baseURL: undefined };
    const result = getPathnameFromConfig(config);
    expect(result).toBe('/path/simple');
  });

  it('retourne l’URL entière sans "?" si URL relative sans query et sans baseURL', () => {
    const config = { url: '/just/path/noQuery', baseURL: undefined };
    const result = getPathnameFromConfig(config);
    expect(result).toBe('/just/path/noQuery');
  });

  it('retourne "" si config.url est undefined', () => {
    // Couvre const url = config.url ?? '';
    const config = { url: undefined, baseURL: undefined };
    const result = getPathnameFromConfig(config as any);
    expect(result).toBe('');
  });

  it('tombe dans catch si baseURL invalide (force exception dans new URL)', () => {
    const config = { url: '/some/path?x=1', baseURL: 'not-a-valid-base' };
    const result = getPathnameFromConfig(config);
    // On retombe dans catch et retourne url.split('?')[0]
    expect(result).toBe('/some/path');
  });

  it('pour URL absolue malformée, new URL normalise souvent en "/" ; on adapte le test', () => {
    // new URL('http://%41:80') normalise en 'http://A:80/' => pathname '/'
    const config = { url: 'http://%41:80', baseURL: undefined };
    const result = getPathnameFromConfig(config);
    expect(result).toBe('/');
  });

  it('utilise URL absolue valide si fournie', () => {
    const config = { url: 'https://example.com/abs/path?x=1', baseURL: undefined };
    const result = getPathnameFromConfig(config);
    expect(result).toBe('/abs/path');
  });

  it('utilise baseURL + url relative valide', () => {
    const config = { url: '/some/path?x=1', baseURL: 'https://example.com' };
    const result = getPathnameFromConfig(config);
    expect(result).toBe('/some/path');
  });

  it('retourne "" si url vide et pas de baseURL', () => {
    const config = { url: '', baseURL: undefined };
    const result = getPathnameFromConfig(config);
    expect(result).toBe('');
  });
});
