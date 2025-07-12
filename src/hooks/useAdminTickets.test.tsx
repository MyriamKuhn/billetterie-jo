import { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { useAdminTickets, type Filters } from './useAdminTickets'
import { API_BASE_URL } from '../config'

// Mock axios
vi.mock('axios')
const mockedGet = vi.spyOn(axios, 'get')

// Helper component that uses the hook
function TestComp({ filters, token }: { filters: Filters; token: string }) {
  const { tickets, total, loading, error, validationErrors } = useAdminTickets(filters, token)
  useEffect(() => {
    // subscribe to changes
  }, [tickets, total, loading, error, validationErrors])
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error ?? 'null'}</div>
      <div data-testid="total">{total}</div>
      <div data-testid="tickets">{JSON.stringify(tickets)}</div>
      <div data-testid="validation">{JSON.stringify(validationErrors)}</div>
    </div>
  )
}

describe('useAdminTickets', () => {
  const baseFilters: Filters = { status: 'issued', per_page: 5, page: 1 }
  const token = 'tok-123'

  beforeEach(() => {
    vi.resetAllMocks();
    // Ensure axios.isAxiosError returns true for our error objects
    (axios as any).isAxiosError = (_err: any) => true
  })

  it('fetches data successfully', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], meta: { total: 10 } }
    })
    render(<TestComp filters={baseFilters} token={token} />)

    // initially loading=true
    expect(screen.getByTestId('loading')).toHaveTextContent('true')

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/tickets`,
        expect.objectContaining({
          params: { per_page: 5, page: 1, status: 'issued' },
          headers: { Authorization: `Bearer ${token}` }
        })
      )
    })

    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('total')).toHaveTextContent('10')
    expect(screen.getByTestId('tickets')).toHaveTextContent('[{"id":1}]')
    expect(screen.getByTestId('error')).toHaveTextContent('null')
    expect(screen.getByTestId('validation')).toHaveTextContent('null')
  })

  it('handles validation error 422', async () => {
    const err: any = new Error('fail')
    err.response = { status: 422, data: { errors: { status: ['invalid'] } } }
    mockedGet.mockRejectedValueOnce(err)

    render(<TestComp filters={baseFilters} token={token} />)
    await waitFor(() => {
      expect(screen.getByTestId('validation')).toHaveTextContent('{"status":["invalid"]}')
    })
    expect(screen.getByTestId('tickets')).toHaveTextContent('[]')
    expect(screen.getByTestId('total')).toHaveTextContent('0')
    expect(screen.getByTestId('error')).toHaveTextContent('null')
  })

  it('handles 404 by emptying results', async () => {
    const err: any = new Error('not found')
    err.response = { status: 404 }
    mockedGet.mockRejectedValueOnce(err)

    render(<TestComp filters={baseFilters} token={token} />)
    await waitFor(() => {
      expect(screen.getByTestId('tickets')).toHaveTextContent('[]')
      expect(screen.getByTestId('total')).toHaveTextContent('0')
    })
    expect(screen.getByTestId('error')).toHaveTextContent('null')
  })

  it('handles other errors by setting error code', async () => {
    const err: any = new Error('network')
    err.code = 'ECONN'
    mockedGet.mockRejectedValueOnce(err)

    render(<TestComp filters={baseFilters} token={token} />)
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('ECONN')
    })
    expect(screen.getByTestId('tickets')).toHaveTextContent('[]')
    expect(screen.getByTestId('total')).toHaveTextContent('0')
  })

  it('ensures per_page minimum of 1', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [], meta: { total: 0 } } })
    render(<TestComp filters={{ ...baseFilters, per_page: 0 }} token={token} />)
    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ params: expect.objectContaining({ per_page: 1 }) })
      )
    })
  })

  it('includes user_id param when provided', async () => {
    const filtersWithUser: Filters = { ...baseFilters, user_id: 7 }
    mockedGet.mockResolvedValueOnce({
      data: { data: [], meta: { total: 0 } }
    })

    render(<TestComp filters={filtersWithUser} token={token} />)

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/tickets`,
        expect.objectContaining({
          params: expect.objectContaining({ user_id: 7 }),
          headers: { Authorization: `Bearer ${token}` }
        })
      )
    })
  })

  it('handles non-Axios errors by setting error code (skips axios.isAxiosError branch)', async () => {
    // Force isAxiosError to false so code goes past that if-block into setError
    ;(axios as any).isAxiosError = () => false
    const err = Object.assign(new Error('oops'), { code: 'EERR' })
    mockedGet.mockRejectedValueOnce(err)

    render(<TestComp filters={baseFilters} token={token} />)

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('EERR')
      // validationErrors remains null
      expect(screen.getByTestId('validation')).toHaveTextContent('null')
    })
  })
})
