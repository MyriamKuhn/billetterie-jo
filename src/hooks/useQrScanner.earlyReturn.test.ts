import { vi, describe, it, expect } from 'vitest';

describe('useQrScanner – branche early-return de start()', () => {
  it('start() résout immédiatement si scannerRef.current est null et n’appelle pas clear/start', async () => {
    // 1️⃣ Reset du cache pour repartir propre
    vi.resetModules();

    // 2️⃣ On mocke React AVANT d’importer le hook
    vi.doMock('react', async () => {
      const actual = await vi.importActual<typeof import('react')>('react');
      return {
        ...actual,
        // on neutralise useEffect : il ne fera jamais tourner le code du hook
        useEffect: (_fn: () => void, _deps?: any[]) => { /* no-op */ },
      };
    });

    // 3️⃣ On mocke html5-qrcode AVANT d’importer le hook
    const clearMock = vi.fn().mockResolvedValue(undefined);
    const startMock = vi.fn().mockResolvedValue(undefined);
    const stopMock  = vi.fn().mockResolvedValue(undefined);
    vi.doMock('html5-qrcode', () => ({
      __esModule: true,
      Html5Qrcode: class {
        constructor(_containerId: string) {
          // ne fait rien
        }
        clear = clearMock;
        start = startMock;
        stop  = stopMock;
      },
    }));

    // 4️⃣ Import dynamique APRÈS les mocks
    const { renderHook } = await import('@testing-library/react');
    const { useQrScanner } = await import('./useQrScanner');

    // 5️⃣ Set up du hook (pas de div#qr-reader dans le DOM, mais useEffect est no-op)
    const containerId = 'qr-reader';
    const onDecode = vi.fn();
    const onError  = vi.fn();
    const { result } = renderHook(
      () => useQrScanner(containerId, onDecode, onError)
    );

    // 6️⃣ On appelle start() => la branche `if (!scannerRef.current) return;`
    await expect(result.current.start()).resolves.toBeUndefined();

    // 7️⃣ Vérification : ni clear, ni start du scanner n’ont tourné
    expect(clearMock).not.toHaveBeenCalled();
    expect(startMock).not.toHaveBeenCalled();
  });
});
