// tests/axiosConfig.test.ts
import axios from 'axios';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

// On importe le module où l’intercepteur est défini.
// L’import exécute le code et enregistre automatiquement l’intercepteur.
import './axiosConfig'; // <-- ajustez selon votre structure

// Mock de useAuthStore.getState
import { useAuthStore } from '../stores/useAuthStore';

// On prépare une fausse implémentation pour useAuthStore.getState()
const clearTokenMock = vi.fn();

// Utility pour restaurer window.location après test
const originalLocation = window.location;

describe('Axios interceptor response (401/403 handling) and pass-through', () => {
  // Nous déclarons ces variables en scope du describe, afin de les assigner dans beforeEach
  let handlers: Array<{ fulfilled?: Function; rejected?: Function }>;
  let responseRejectedHandler: (error: any) => Promise<any>;
  let responseFulfilledHandler: (response: any) => any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock de useAuthStore.getState(): retourne un objet avec clearToken
    vi.spyOn(useAuthStore, 'getState').mockImplementation(() => ({
      clearToken: clearTokenMock,
      // autres propriétés éventuelles ignorées
    }) as any);

    // Préparer window.location mockable
    // Supprime la propriété pour pouvoir la redéfinir
    // @ts-ignore
    delete window.location;
    // Recrée window.location avec les props nécessaires
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = {
      pathname: '/',
      href: '',
      assign(url: string) {
        this.href = url;
      },
    };

    // Récupérer la liste des handlers interceptors
    // Cast en any car TS peut ne pas connaître cette propriété
    // @ts-ignore
    handlers = (axios.interceptors.response as any).handlers as Array<{ fulfilled?: Function; rejected?: Function }>;
    expect(Array.isArray(handlers)).toBe(true);

    // Récupérer le handler rejected le plus récent
    const rawRejected = handlers[handlers.length - 1].rejected;
    if (typeof rawRejected !== 'function') {
      throw new Error('Le handler rejected attendu n’est pas une fonction');
    }
    responseRejectedHandler = rawRejected as (error: any) => Promise<any>;

    // Récupérer aussi le handler fulfilled (pour couvrir response => response)
    const rawFulfilled = handlers[handlers.length - 1].fulfilled;
    if (typeof rawFulfilled !== 'function') {
      throw new Error('Le handler fulfilled attendu n’est pas une fonction');
    }
    responseFulfilledHandler = rawFulfilled as (response: any) => any;
  });

  afterEach(() => {
    // Restaurer window.location original
    Object.defineProperty(window, 'location', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: originalLocation,
    });
    // Restaurer les mocks
    vi.restoreAllMocks();
  });

  // Helper pour exécuter l’intercepteur et capturer la rejection
  async function callInterceptor(errorObj: any) {
    try {
      // On exécute le handler, qui doit rejeter
      await responseRejectedHandler(errorObj);
      // Si jamais ça résout plutôt que rejette, on le signale
      return { resolved: true };
    } catch (err) {
      return { resolved: false, error: err };
    }
  }

  it('doit passer through les réponses réussies (fulfilled handler)', async () => {
    const sampleResponse = { data: { foo: 'bar' }, status: 200, config: { url: '/any', baseURL: undefined } };
    const result = responseFulfilledHandler(sampleResponse);
    // Le handler fulfilled doit renvoyer exactement l’objet passé
    expect(result).toBe(sampleResponse);
  });

  it('devrait traiter 401 pour endpoint non public : clearToken et redirige vers /login', async () => {
    // Config : URL simulée non publique
    const error = {
      response: { status: 401 },
      config: { url: '/api/protected/data?param=1', baseURL: undefined },
    };

    // Assurons-nous que window.location.pathname est autre que '/login'
    window.location.pathname = '/somepage';
    window.location.href = '';

    const result = await callInterceptor(error);

    // On s’attend à rejection
    expect(result.resolved).toBe(false);
    // clearToken doit avoir été appelé
    expect(clearTokenMock).toHaveBeenCalledTimes(1);
    // Redirection vers /login
    expect(window.location.href).toBe('/login');
  });

  it('devrait traiter 401 pour URL relative sans query string (couverture de return url.split)', async () => {
    // URL relative sans '?', pour couvrir le return url.split('?')[0]
    const error = {
      response: { status: 401 },
      config: { url: '/api/protected/simplePath', baseURL: undefined },
    };
    window.location.pathname = '/foo';
    window.location.href = '';

    const result = await callInterceptor(error);

    expect(result.resolved).toBe(false);
    expect(clearTokenMock).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('/login');
  });

  it('ne doit pas traiter 401 pour endpoint public : ne pas clearToken, ne pas rediriger', async () => {
    // On teste un endpoint public listé dans PUBLIC_PATHS
    const error = {
      response: { status: 401 },
      config: { url: '/api/auth/login?foo=bar', baseURL: undefined },
    };

    window.location.pathname = '/current';
    window.location.href = '';

    const result = await callInterceptor(error);

    expect(result.resolved).toBe(false);
    // clearToken NE DOIT PAS être appelé
    expect(clearTokenMock).not.toHaveBeenCalled();
    // Pas de redirection
    expect(window.location.href).toBe('');
  });

  it('traiter 403 : redirige vers /unauthorized, sans clearToken', async () => {
    const error = {
      response: { status: 403 },
      config: { url: '/any/path', baseURL: undefined },
    };

    window.location.pathname = '/current';
    window.location.href = '';

    const result = await callInterceptor(error);

    expect(result.resolved).toBe(false);
    // clearToken NE DOIT PAS être appelé
    expect(clearTokenMock).not.toHaveBeenCalled();
    // Redirection vers /unauthorized
    expect(window.location.href).toBe('/unauthorized');
  });

  it('gère URL absolue dans config.url pour getPathnameFromConfig', async () => {
    // On simule une URL absolue hors PUBLIC_PATHS
    const error = {
      response: { status: 401 },
      config: { url: 'https://example.com/api/protected/xyz?x=1', baseURL: undefined },
    };
    window.location.pathname = '/other';
    window.location.href = '';
    const result = await callInterceptor(error);

    expect(result.resolved).toBe(false);
    expect(clearTokenMock).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('/login');
  });

  it('gère baseURL + url relative pour getPathnameFromConfig', async () => {
    // url relative + baseURL
    const error = {
      response: { status: 401 },
      config: { url: '/api/protected/withbase', baseURL: 'https://api.example.com' },
    };
    window.location.pathname = '/foo';
    window.location.href = '';
    const result = await callInterceptor(error);

    expect(result.resolved).toBe(false);
    expect(clearTokenMock).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('/login');
  });

  it('gère URL invalide dans getPathnameFromConfig en tombant sur catch', async () => {
    // Simulons une URL invalide: fera fallback à split('?')[0]
    const error = {
      response: { status: 401 },
      config: { url: 'not a valid url ??? //', baseURL: undefined },
    };
    window.location.pathname = '/x';
    window.location.href = '';
    const result = await callInterceptor(error);

    // path = 'not a valid url ' split '?', startsWith PUBLIC_PATHS? non => traité comme non public
    expect(result.resolved).toBe(false);
    expect(clearTokenMock).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('/login');
  });

  it('si error.response absent ou status différent de 401/403, ne fait rien de spécial mais rejette', async () => {
    // Cas où error.response undefined
    const error = {
      response: undefined,
      config: { url: '/anything', baseURL: undefined },
    };
    window.location.href = '';
    window.location.pathname = '/x';
    const result = await callInterceptor(error);
    // Pas de clearToken, pas de redirection
    expect(clearTokenMock).not.toHaveBeenCalled();
    expect(window.location.href).toBe('');
    expect(result.resolved).toBe(false);

    // Cas status 500: pas 401/403 → idem
    const error2 = {
      response: { status: 500 },
      config: { url: '/anything', baseURL: undefined },
    };
    window.location.href = '';
    window.location.pathname = '/x';
    const result2 = await callInterceptor(error2);
    expect(clearTokenMock).not.toHaveBeenCalled();
    expect(window.location.href).toBe('');
    expect(result2.resolved).toBe(false);
  });
});

describe('Axios interceptor response (401/403 handling) and pass-through', () => {
  let handlers: Array<{ fulfilled?: Function; rejected?: Function }>;
  let responseRejectedHandler: (error: any) => Promise<any>;
  let responseFulfilledHandler: (response: any) => any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock useAuthStore.getState()
    vi.spyOn(useAuthStore, 'getState').mockImplementation(() => ({
      clearToken: clearTokenMock,
    }) as any);

    // Mock window.location
    // @ts-ignore
    delete window.location;
    (window as any).location = {
      pathname: '/',
      href: '',
      assign(url: string) {
        this.href = url;
      },
    };

    // Récupérer les handlers interceptors Axios
    // @ts-ignore
    handlers = (axios.interceptors.response as any).handlers as Array<{ fulfilled?: Function; rejected?: Function }>;
    expect(Array.isArray(handlers)).toBe(true);
    const last = handlers[handlers.length - 1];
    if (typeof last.fulfilled !== 'function' || typeof last.rejected !== 'function') {
      throw new Error('Expected axios interceptor handlers to have fulfilled & rejected functions');
    }
    responseFulfilledHandler = last.fulfilled as (resp: any) => any;
    responseRejectedHandler = last.rejected as (error: any) => Promise<any>;
  });

  afterEach(() => {
    // Restaurer window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  // Helper pour appeler le rejected handler
  async function callInterceptor(errorObj: any) {
    try {
      await responseRejectedHandler(errorObj);
      return { resolved: true };
    } catch (err) {
      return { resolved: false, error: err };
    }
  }

  it('doit passer through les réponses réussies (fulfilled handler)', () => {
    const sampleResponse = { data: { foo: 'bar' }, status: 200, config: { url: '/any', baseURL: undefined } };
    const result = responseFulfilledHandler(sampleResponse);
    expect(result).toBe(sampleResponse);
  });

  it('401 non-public : clearToken et redirige vers /login si pathname != /login', async () => {
    const error = {
      response: { status: 401 },
      config: { url: '/api/protected/data?param=1', baseURL: undefined },
    };
    window.location.pathname = '/somepage';
    window.location.href = '';

    const result = await callInterceptor(error);
    expect(result.resolved).toBe(false);
    expect(clearTokenMock).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('/login');
  });

  it('401 non-public mais déjà sur /login : clearToken mais PAS de redirection', async () => {
    const error = {
      response: { status: 401 },
      config: { url: '/api/protected/data', baseURL: undefined },
    };
    window.location.pathname = '/login';
    window.location.href = '';

    const result = await callInterceptor(error);
    expect(result.resolved).toBe(false);
    // clearToken doit être appelé même si on est déjà sur /login
    expect(clearTokenMock).toHaveBeenCalledTimes(1);
    // PAS de redirection car pathname === '/login'
    expect(window.location.href).toBe('');
  });

  it('401 public endpoint : ne pas clearToken, ne pas rediriger', async () => {
    const error = {
      response: { status: 401 },
      config: { url: '/api/auth/login?foo=bar', baseURL: undefined },
    };
    window.location.pathname = '/current';
    window.location.href = '';

    const result = await callInterceptor(error);
    expect(result.resolved).toBe(false);
    expect(clearTokenMock).not.toHaveBeenCalled();
    expect(window.location.href).toBe('');
  });

  it('403 non-public : redirige vers /unauthorized si pathname != /unauthorized', async () => {
    const error = {
      response: { status: 403 },
      config: { url: '/any/path', baseURL: undefined },
    };
    window.location.pathname = '/current';
    window.location.href = '';

    const result = await callInterceptor(error);
    expect(result.resolved).toBe(false);
    expect(clearTokenMock).not.toHaveBeenCalled();
    expect(window.location.href).toBe('/unauthorized');
  });

  it('403 mais déjà sur /unauthorized : ne pas rediriger, ne pas clearToken', async () => {
    const error = {
      response: { status: 403 },
      config: { url: '/any/path', baseURL: undefined },
    };
    window.location.pathname = '/unauthorized';
    window.location.href = '';

    const result = await callInterceptor(error);
    expect(result.resolved).toBe(false);
    expect(clearTokenMock).not.toHaveBeenCalled();
    // PAS de redirection car pathname === '/unauthorized'
    expect(window.location.href).toBe('');
  });

  // ... autres tests (URL absolue, baseURL, URL invalide, etc.) ...
});

