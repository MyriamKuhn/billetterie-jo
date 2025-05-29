import { describe, it, beforeEach, expect, vi } from 'vitest';
import { ErrorBoundaryInner } from './ErrorBoundary';
import type { TFunction } from 'i18next';

// Mock minimaliste de la fonction de traduction
const tMock = ((key: string) => key) as TFunction;
;(tMock as any).$TFunctionBrand = {};

// Props nécessaires pour l'instance
const defaultTranslationProps = {
  t: tMock,
  i18n: {} as any,
  tReady: true,
  children: null as any,
};

describe('ErrorBoundaryInner.handleReload', () => {
  let instance: ErrorBoundaryInner;
  let setStateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    instance = new ErrorBoundaryInner(defaultTranslationProps);
    setStateSpy = vi.spyOn(instance, 'setState');
    instance.state = { hasError: true, reloadKey: 5 };
  });

  it('should call setState with correct updater function', () => {
    instance.handleReload();
    expect(setStateSpy).toHaveBeenCalledTimes(1);
    const updater = setStateSpy.mock.calls[0][0] as (prev: any) => any;
    expect(updater({ hasError: true, reloadKey: 5 })).toEqual({ hasError: false, reloadKey: 6 });
  });
});
