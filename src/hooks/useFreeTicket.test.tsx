import { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { useFreeTicket, type freeTicket as FreeTicketPayload } from './useFreeTicket'
import * as authStore from '../stores/useAuthStore'
import * as logger from '../utils/logger'
import { API_BASE_URL } from '../config'

// Mocks
vi.mock('axios')
vi.mock('../stores/useAuthStore')
vi.mock('../utils/logger')

interface TestCompProps {
  payload: FreeTicketPayload
  onResult: (res: boolean) => void
}

function TestComp({ payload, onResult }: TestCompProps) {
  const free = useFreeTicket()
  useEffect(() => {
    (async () => {
      const result = await free(payload)
      onResult(result)
    })()
  }, [payload, onResult])
  return null
}

describe('useFreeTicket', () => {
  const mockLogError = vi.spyOn(logger, 'logError')

  beforeEach(() => {
    vi.resetAllMocks()
    // Provide full AuthState so selector works
    vi.spyOn(authStore, 'useAuthStore').mockImplementation(selector =>
      selector({
        authToken: 'tok-abc',
        role: 'user',
        remember: false,
        setToken: () => {},
        clearToken: () => {},
      } as any)
    )
  })

  it('calls axios.post with correct args and returns true on success', async () => {
    ;(axios.post as any).mockResolvedValueOnce({ status: 200 })
    let resultValue: boolean | null = null

    render(
      <TestComp
        payload={{ user_id: 1, product_id: 2, quantity: 3, locale: 'en' }}
        onResult={res => {
          resultValue = res
        }}
      />
    )

    await waitFor(() => {
      expect(resultValue).toBe(true)
      expect(axios.post).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/tickets`,
        { user_id: 1, product_id: 2, quantity: 3, locale: 'en' },
        {
          headers: {
            Authorization: 'Bearer tok-abc',
            'Content-Type': 'application/json',
          },
        }
      )
    })
  })

  it('logs error and returns false on failure', async () => {
    const error = new Error('fail')
    ;(axios.post as any).mockRejectedValueOnce(error)
    let resultValue: boolean | null = null

    render(
      <TestComp
        payload={{ user_id: 10, product_id: 20, quantity: 1, locale: 'fr' }}
        onResult={res => {
          resultValue = res
        }}
      />
    )

    await waitFor(() => {
      expect(resultValue).toBe(false)
      expect(mockLogError).toHaveBeenCalledWith('useFreeTicket', error)
    })
  })
})
