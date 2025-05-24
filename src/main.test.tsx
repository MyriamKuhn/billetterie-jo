import { beforeEach, describe, it, expect, vi } from 'vitest'

beforeEach(() => {
  // Remet un <div id="root"> et vide le cache des modules
  document.body.innerHTML = '<div id="root"></div>'
  vi.resetModules()
})

// On veut mocker le default export de react-dom/client
const renderMock = vi.fn()
const createRootMock = vi.fn(() => ({ render: renderMock }))

vi.mock('react-dom/client', () => ({
  default: {
    createRoot: createRootMock,
  },
}))

// Mock de Root pour isoler main.tsx
vi.mock('./Root', () => ({
  Root: () => null,
}))

describe('main.tsx', () => {
  it('instancie ReactDOM.createRoot sur #root et y render <Root />', async () => {
    // Importer après avoir posé les mocks
    await import('./main')

    const container = document.getElementById('root')
    expect(container).not.toBeNull()

    // createRoot doit être appelé avec notre container
    expect(createRootMock).toHaveBeenCalledWith(container)
    // puis render() doit avoir été invoqué
    expect(renderMock).toHaveBeenCalledTimes(1)
  })
})
