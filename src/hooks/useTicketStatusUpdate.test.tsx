import { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { useTicketStatusUpdate, type TicketStatusUpdate } from './useTicketStatusUpdate'
import * as authStore from '../stores/useAuthStore'
import * as logger from '../utils/logger'
import { API_BASE_URL } from '../config'

// Mocks
vi.mock('axios')
vi.mock('../stores/useAuthStore')
vi.mock('../utils/logger')

interface TestCompProps {
  ticketId: number
  update: TicketStatusUpdate
  onResult: (res: boolean) => void
}

function TestComp({ ticketId, update, onResult }: TestCompProps) {
  const statusUpdate = useTicketStatusUpdate()
  useEffect(() => {
    ;(async () => {
      const result = await statusUpdate(ticketId, update)
      onResult(result)
    })()
  }, [ticketId, update, onResult])
  return null
}

describe('useTicketStatusUpdate', () => {
  const mockLogError = vi.spyOn(logger, 'logError')

  beforeEach(() => {
    vi.resetAllMocks()
    // Provide full AuthState
    vi.spyOn(authStore, 'useAuthStore').mockImplementation(selector =>
      selector({
        authToken: 'tok-xyz',
        role: 'admin',
        remember: false,
        setToken: () => {},
        clearToken: () => {},
      } as any)
    )
  })

  it('sends PUT and returns true on success', async () => {
    ;(axios.put as any).mockResolvedValueOnce({ status: 200 })
    let resultValue: boolean | null = null

    render(
      <TestComp
        ticketId={42}
        update={{ status: 'used' }}
        onResult={res => {
          resultValue = res
        }}
      />
    )

    await waitFor(() => {
      expect(resultValue).toBe(true)
      expect(axios.put).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/tickets/admin/42/status`,
        { status: 'used' },
        {
          headers: {
            Authorization: 'Bearer tok-xyz',
            'Content-Type': 'application/json',
          },
        }
      )
    })
  })

  it('logs error and returns false on failure', async () => {
    const error = new Error('fail-update')
    ;(axios.put as any).mockRejectedValueOnce(error)
    let resultValue: boolean | null = null

    render(
      <TestComp
        ticketId={99}
        update={{ status: 'cancelled' }}
        onResult={res => {
          resultValue = res
        }}
      />
    )

    await waitFor(() => {
      expect(resultValue).toBe(false)
      expect(mockLogError).toHaveBeenCalledWith('useTicketStatusUpdate', error)
    })
  })
})
