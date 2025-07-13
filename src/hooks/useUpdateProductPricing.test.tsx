import { render } from '@testing-library/react'
import axios from 'axios'
import { beforeEach, describe, it, vi, expect, type Mock } from 'vitest'
import { useUpdateProductPricing, type PricingUpdate } from './useUpdateProductPricing'
import { API_BASE_URL } from '../config'
import { useAuthStore } from '../stores/useAuthStore'
import { logError } from '../utils/logger'

// 1) On mocke le hook d'authentification et le logger
vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: vi.fn()
}))
vi.mock('../utils/logger', () => ({
  logError: vi.fn()
}))

describe('useUpdateProductPricing', () => {
  let updatePricing: (productId: number, updates: PricingUpdate) => Promise<boolean>

  // Petit composant pour invoquer le hook et récupérer la fonction renvoyée
  function Grabber() {
    updatePricing = useUpdateProductPricing()
    return null
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // On exécute le selector pour couvrir la ligne `s => s.authToken`
    ;(useAuthStore as unknown as Mock).mockImplementation(
      (selector: (state: { authToken: string }) => string) =>
        selector({ authToken: 'fake-token' })
    )
    render(<Grabber />)
  })

  it('renvoie true et appelle axios.patch correctement en cas de succès', async () => {
    const patchSpy = vi.spyOn(axios, 'patch').mockResolvedValue({})

    const updates: PricingUpdate = {
      price: 123,
      sale: 0.45,
      stock_quantity: 10,
    }

    const result = await updatePricing(99, updates)

    // Vérifie la bonne URL, le bon payload et les bons headers
    expect(patchSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/products/99/pricing`,
      updates,
      {
        headers: {
          Authorization: 'Bearer fake-token',
          'Content-Type': 'application/json',
        },
      }
    )
    expect(result).toBe(true)
  })

  it('renvoie false et logError en cas d’échec', async () => {
    const error = new Error('patch failed')
    vi.spyOn(axios, 'patch').mockRejectedValue(error)

    const result = await updatePricing(5, { price: 1, sale: 0, stock_quantity: 0 })

    expect(logError).toHaveBeenCalledWith('useUpdateProductPricing', error)
    expect(result).toBe(false)
  })
})
