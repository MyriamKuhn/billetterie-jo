// src/utils/logger.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logError, logWarn } from './logger';

describe('logger utilities', () => {
  let originalMode: string | undefined;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Save original mode and spy on console methods
    originalMode = import.meta.env.MODE;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console spies and import.meta.env.MODE
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    if (originalMode !== undefined) {
      import.meta.env.MODE = originalMode;
    }
  });

  it('logError should call console.error in development mode', () => {
    import.meta.env.MODE = 'development';
    const err = new Error('test error');
    logError('myContext', err);
    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    expect(consoleErrorSpy).toHaveBeenCalledWith('[myContext]', err);
  });

  it('logError should not call console.error outside development mode', () => {
    import.meta.env.MODE = 'production';
    const err = new Error('should not log');
    logError('ctx', err);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('logWarn should call console.warn in development mode', () => {
    import.meta.env.MODE = 'development';
    const warning = 'this is a warning';
    logWarn('warnContext', warning);
    expect(consoleWarnSpy).toHaveBeenCalledOnce();
    expect(consoleWarnSpy).toHaveBeenCalledWith('[warnContext]', warning);
  });

  it('logWarn should not call console.warn outside development mode', () => {
    import.meta.env.MODE = 'test'; // any non-development mode
    const warning = 'no warning';
    logWarn('ctxWarn', warning);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
