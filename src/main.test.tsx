import { beforeEach, describe, it, expect, vi } from 'vitest'

beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>'
  vi.resetModules()
})

const renderMock = vi.fn()
const createRootMock = vi.fn(() => ({ render: renderMock }))

vi.mock('react-dom/client', () => ({
  default: {
    createRoot: createRootMock,
  },
}))

vi.mock('./Root', () => ({
  Root: () => null,
}))

describe('main.tsx', () => {
  it('instancie ReactDOM.createRoot sur #root et y render <Root />', async () => {
    await import('./main')
    const container = document.getElementById('root')
    expect(createRootMock).toHaveBeenCalledWith(container)
    expect(renderMock).toHaveBeenCalledTimes(1)
  })

  it('désactive scrollRestoration du navigateur', async () => {
    // 1. Simule un état initial de scrollRestoration
    window.history.scrollRestoration = 'auto'

    // 2. Recharge le module main.tsx
    await import('./main')

    // 3. Vérifie que la propriété a été passée en manuel
    expect(window.history.scrollRestoration).toBe('manual')
  })
})
