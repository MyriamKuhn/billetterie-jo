import { render } from '@testing-library/react'
import axios from 'axios'
import { beforeEach, describe, it, vi, expect, type Mock } from 'vitest'
import { useUpdateProductDetails } from './useUpdateProductDetails'
import { API_BASE_URL } from '../config'
import { useAuthStore } from '../stores/useAuthStore'
import { logError } from '../utils/logger'

// 1) On mocke useAuthStore et logger
vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: vi.fn()
}))
vi.mock('../utils/logger', () => ({
  logError: vi.fn()
}))

describe('useUpdateProductDetails', () => {
  let updateFn: (productId: number, body: FormData) => Promise<boolean>

  // Petit composant pour extraire la fonction retournée par le hook
  function Grabber() {
    updateFn = useUpdateProductDetails()
    return null
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Important : on exécute ici le selector pour couvrir `s => s.authToken`
    ;(useAuthStore as unknown as Mock).mockImplementation(
      (selector: (state: { authToken: string }) => string) =>
        selector({ authToken: 'fake-token' })
    )

    render(<Grabber />)
  })

  it('renvoie true et appelle axios.post correctement en cas de succès', async () => {
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({})

    const form = new FormData()
    form.append('foo', 'bar')

    const result = await updateFn(42, form)

    expect(postSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/products/42`,
      form,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: 'Bearer fake-token'
        }
      }
    )
    expect(result).toBe(true)
  })

  it('renvoie false et logError en cas d’échec', async () => {
    const error = new Error('network down')
    vi.spyOn(axios, 'post').mockRejectedValue(error)

    const result = await updateFn(99, new FormData())

    expect(logError).toHaveBeenCalledWith('useUpdateProductDetails', error)
    expect(result).toBe(false)
  })
})
