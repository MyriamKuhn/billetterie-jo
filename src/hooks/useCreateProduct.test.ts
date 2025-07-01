// src/hooks/useCreateProduct.test.ts
import axios from 'axios'
import { API_BASE_URL } from '../config'
import { useCreateProduct } from './useCreateProduct'
import { useAuthStore } from '../stores/useAuthStore'
import { logError } from '../utils/logger'
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

// 1) on mocke axios.post
vi.mock('axios')

// 2) on mocke logError
vi.mock('../utils/logger', () => ({
  logError: vi.fn()
}))

// 3) on mocke useAuthStore de façon à réellement appeler le sélecteur
//    et renvoyer { authToken: 'mock-token' }
vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: vi.fn((selector: (state: { authToken: string }) => any) => {
    // exécution du selector pour couvrir `s => s.authToken`
    return selector({ authToken: 'mock-token' })
  })
}))

describe('useCreateProduct', () => {
  const postMock = axios.post as unknown as Mock
  const authStoreMock = useAuthStore as unknown as Mock
  const logErrorMock = logError as unknown as Mock

  beforeEach(() => {
    postMock.mockReset()
    authStoreMock.mockClear()
    logErrorMock.mockClear()
  })

  it('doit appeler useAuthStore pour récupérer authToken', () => {
    useCreateProduct()
    expect(authStoreMock).toHaveBeenCalledTimes(1)
  })

  it('↑ succès : axios.post est appelé et renvoie true', async () => {
    postMock.mockResolvedValue({})

    const createProduct = useCreateProduct()
    const fm = new FormData()
    fm.append('foo', 'bar')

    const ok = await createProduct(fm)

    expect(postMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/products`,
      fm,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: 'Bearer mock-token'
        }
      }
    )
    expect(ok).toBe(true)
    expect(logErrorMock).not.toHaveBeenCalled()
  })

  it('↑ échec : logError est appelé et renvoie false', async () => {
    const err = new Error('boom')
    postMock.mockRejectedValue(err)

    const createProduct = useCreateProduct()
    const ok = await createProduct(new FormData())

    expect(logErrorMock).toHaveBeenCalledWith('useUpdateProductDetails', err)
    expect(ok).toBe(false)
  })
})
