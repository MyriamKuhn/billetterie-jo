import { render } from '@testing-library/react'
import axios from 'axios'
import { usePaymentRefund, type PaymentRefund } from './usePaymentRefund'
import { useAuthStore } from '../stores/useAuthStore'
import { logError } from '../utils/logger'
import { API_BASE_URL } from '../config'        // ← on importe la constante
import type { Mock } from 'vitest'

vi.mock('axios')
vi.mock('../stores/useAuthStore')
vi.mock('../utils/logger')

describe('usePaymentRefund', () => {
  const dummyToken = 'tok-123'
  let refundFn: (uuid: string, data: PaymentRefund) => Promise<boolean>

  function TestComponent() {
    refundFn = usePaymentRefund()
    return null
  }

  beforeEach(() => {
    ;(useAuthStore as unknown as Mock).mockImplementation(selector =>
      selector({ authToken: dummyToken })
    )
    vi.clearAllMocks()
    render(<TestComponent />)
  })

  it('renvoie true et appelle axios.post avec les bons arguments en cas de succès', async () => {
    ;(axios.post as Mock).mockResolvedValueOnce({ status: 200 })

    const result = await refundFn('ABC-uuid', { amount: 42 })
    expect(result).toBe(true)
    expect(axios.post).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/payments/ABC-uuid/refund`,  // ← on utilise API_BASE_URL
      { amount: 42 },
      {
        headers: {
          Authorization: `Bearer ${dummyToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
  })

  it('renvoie false et logError en cas d’erreur', async () => {
    const error = new Error('échec réseau')
    ;(axios.post as Mock).mockRejectedValueOnce(error)

    const result = await refundFn('XYZ-123', { amount: 10 })
    expect(result).toBe(false)
    expect(logError).toHaveBeenCalledWith('usePaymentRefund', error)
  })
})
