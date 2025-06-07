// src/utils/logger.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { logError, logWarn, logInfo } from './logger'

describe('logger utilities', () => {
  let originalMode: string | undefined
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    originalMode = import.meta.env.MODE
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleLogSpy.mockRestore()
    if (originalMode !== undefined) {
      import.meta.env.MODE = originalMode
    }
  })

  it('logError should call console.error in development mode', () => {
    import.meta.env.MODE = 'development'
    const err = new Error('test error')
    logError('myContext', err)
    expect(consoleErrorSpy).toHaveBeenCalledOnce()
    expect(consoleErrorSpy).toHaveBeenCalledWith('[myContext]', err)
  })

  it('logError should not call console.error outside development mode', () => {
    import.meta.env.MODE = 'production'
    const err = new Error('should not log')
    logError('ctx', err)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('logWarn should call console.warn in development mode', () => {
    import.meta.env.MODE = 'development'
    const warning = 'this is a warning'
    logWarn('warnContext', warning)
    expect(consoleWarnSpy).toHaveBeenCalledOnce()
    expect(consoleWarnSpy).toHaveBeenCalledWith('[warnContext]', warning)
  })

  it('logWarn should not call console.warn outside development mode', () => {
    import.meta.env.MODE = 'test' // any non-development mode
    const warning = 'no warning'
    logWarn('ctxWarn', warning)
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  it('logInfo should call console.log in development mode', () => {
    import.meta.env.MODE = 'development'
    const info = { foo: 'bar' }
    logInfo('infoContext', info)
    expect(consoleLogSpy).toHaveBeenCalledOnce()
    expect(consoleLogSpy).toHaveBeenCalledWith('[infoContext]', info)
  })

  it('logInfo should not call console.log outside development mode', () => {
    import.meta.env.MODE = 'production'
    const info = 'should not log'
    logInfo('ctxInfo', info)
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })
})
