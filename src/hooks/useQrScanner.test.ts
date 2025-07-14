import { vi, describe, it, expect, beforeEach } from 'vitest';

// 1️⃣ Mocks partagés
const clearMock      = vi.fn().mockResolvedValue(undefined);
const startMock      = vi.fn().mockResolvedValue(undefined);
const stopMock       = vi.fn().mockResolvedValue(undefined);
const constructedWith: string[] = [];

// 2️⃣ Mock du module avant tout import
vi.mock('html5-qrcode', () => ({
  __esModule: true,
  Html5Qrcode: class {
    containerId: string;
    constructor(containerId: string) {
      this.containerId = containerId;
      constructedWith.push(containerId);
    }
    clear = clearMock;
    start = startMock;
    stop  = stopMock;
  },
}));

// 3️⃣ Imports réels
import { renderHook, act, type RenderHookResult } from '@testing-library/react';
import { useQrScanner } from './useQrScanner';

// 4️⃣ Tests
describe('useQrScanner', () => {
  const containerId = 'qr-reader';
  let onDecode: ReturnType<typeof vi.fn>;
  let onError:  ReturnType<typeof vi.fn>;
  let hook:     RenderHookResult<ReturnType<typeof useQrScanner>, void>;

  beforeEach(() => {
    // Réinitialisation des spies et du DOM
    clearMock.mockClear();
    startMock.mockClear();
    stopMock.mockClear();
    constructedWith.length = 0;

    document.body.innerHTML = `<div id="${containerId}"></div>`;
    onDecode = vi.fn();
    onError  = vi.fn();

    hook = renderHook<ReturnType<typeof useQrScanner>, void>(
      () => useQrScanner(containerId, onDecode, onError)
    );
  });

  it('instancie Html5Qrcode avec le bon ID et appelle clear/start au montage', async () => {
    // permet au useEffect de s’exécuter
    await act(async () => {});
    expect(constructedWith).toEqual([containerId]);
    expect(clearMock).toHaveBeenCalledOnce();
    expect(startMock).toHaveBeenCalledOnce();
  });

  it('expose start() qui relance clear+start', async () => {
    await act(async () => {});
    await act(async () => { await hook.result.current.start(); });
    expect(clearMock).toHaveBeenCalledTimes(2);
    expect(startMock).toHaveBeenCalledTimes(2);
  });

  it('expose stop() qui appelle stop() après un start()', async () => {
    await act(async () => {});
    await act(async () => { await hook.result.current.start(); });
    await act(async () => { await hook.result.current.stop(); });
    expect(stopMock).toHaveBeenCalledOnce();
  });

  it('redirige les erreurs de start() vers onError', async () => {
    // fait throw à la prochaine exécution de start()
    startMock.mockImplementationOnce(async () => { throw new Error('boom'); });
    // remonte un hook frais
    renderHook<ReturnType<typeof useQrScanner>, void>(
      () => useQrScanner(containerId, onDecode, onError)
    );
    await act(async () => {});
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('arrête vraiment le scanner dans le cleanup (unmount)', async () => {
    const { unmount } = hook;
    await act(async () => {});
    unmount();
    // cleanup appelle stop() une fois
    expect(stopMock).toHaveBeenCalledOnce();
  });

  it('passe bien un callback d’erreur (même vide) à Html5Qrcode.start', async () => {
    // laisse useEffect et start() s’exécuter
    await act(async () => {});

    // on vérifie que start a été appelé avec :
    //   - constraints { facingMode: 'environment' }
    //   - settings { fps: 10, qrbox: 250 }
    //   - le onDecode fourni
    //   - un 4ème argument qui est bien une fonction
    expect(startMock).toHaveBeenCalledWith(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      onDecode,
      expect.any(Function)
    );
  });

  // ➋ Branche “if (scannerRef.current) return;” dans useEffect()
  // On fait un rerender avec le même containerId pour que scannerRef.current soit truthy
  // et que l’effet early-return sans ré-instanciation soit couvert.
  it('ne réinstancie pas Html5Qrcode lors d’un rerender (scannerRef.current truthy)', async () => {
    // on déclenche le premier mount/useEffect
    await act(async () => {});
    // on force un rerender
    hook.rerender();
    // on attend le flush du second useEffect
    await act(async () => {});

    // toujours une seule instanciation
    expect(constructedWith).toEqual([containerId]);
  });

  it('évite de ré-instancier Html5Qrcode si scannerRef.current existe déjà', async () => {
    // ➊ on flush le premier useEffect (montage initial)
    await act(async () => {});

    // à ce stade, constructedWith === [containerId]
    expect(constructedWith).toHaveLength(1);

    // ➋ on force un rerender avec le même containerId
    hook.rerender();

    // ➌ on flush le second useEffect
    await act(async () => {});

    // ➍ on s’assure qu’on n’a toujours qu’une seule instanciation
    expect(constructedWith).toHaveLength(1);
    expect(constructedWith[0]).toBe(containerId);
  });

  it('skippe l’instanciation si scannerRef.current existe déjà quand containerId change', async () => {
    const onDecode = vi.fn();
    const onError  = vi.fn();

    // 1️⃣ renderHook en mode props pour pouvoir changer l’ID
    const { rerender } = renderHook<
      ReturnType<typeof useQrScanner>,
      { id: string }
    >(
      ({ id }) => useQrScanner(id, onDecode, onError),
      { initialProps: { id: containerId } }
    );

    // 2️⃣ flush des effets initiaux (StrictMode montera-démontera-remontera)
    await act(async () => {});

    // 3️⃣ capture du nombre d’instanciations réalisées
    const initialCount = constructedWith.length;
    expect(initialCount).toBeGreaterThan(0);
    // on s’assure qu’elles sont toutes pour l’ID initial
    expect(constructedWith).not.toContain('qr-reader-2');

    // 4️⃣ rerender avec un nouvel ID pour ré-exécuter useEffect
    const newId = 'qr-reader-2';
    rerender({ id: newId });
    await act(async () => {});

    // 5️⃣ on vérifie que la taille du tableau n’a **pas** bougé
    expect(constructedWith).toHaveLength(initialCount);
    // et qu’aucune instance n’a été créée pour newId
    expect(constructedWith).not.toContain(newId);
  });

  it('le callback d’erreur par défaut ne fait rien', async () => {
    // ➊ laisse tourner l’effet pour que startMock soit appelé
    await act(async () => {});

    // ➋ récupère le 4ᵉ argument passé à startMock : c’est ton () => {}
    const errorCb = startMock.mock.calls[0][3] as () => void;

    // ➌ vérifie que c’est bien une fonction
    expect(typeof errorCb).toBe('function');

    // ➍ appelle-la avec n’importe quelle valeur
    errorCb();

    // ➎ et surtout : cela ne doit pas appeler onError ni provoquer d’erreur
    expect(onError).not.toHaveBeenCalled();
  });

  it('le callback d’erreur par défaut est un no-op', async () => {
    // ➊ on flush le useEffect pour que startMock soit appelé une première fois
    await act(async () => {});

    // ➋ on récupère le 4ᵉ argument de startMock, c’est bien notre () => {}
    const errorCallback = startMock.mock.calls[0][3];
    expect(typeof errorCallback).toBe('function');

    // ➌ on l’invoque avec n’importe quoi (ici une string)
    expect(() => {
      (errorCallback as Function)('any error');
    }).not.toThrow();

    // ➍ on s’assure que ça ne déclenche pas ton onError
    expect(onError).not.toHaveBeenCalled();
  });
});