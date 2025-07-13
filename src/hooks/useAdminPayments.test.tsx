import { render, screen, waitFor, cleanup } from '@testing-library/react'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import { useAdminPayments, type Filters } from './useAdminPayments'
import type { Mock } from 'vitest'

// Mock axios
vi.mock('axios')
const mockedGet = axios.get as unknown as Mock

// Spy isAxiosError
vi.spyOn(axios, 'isAxiosError').mockImplementation(err => Boolean((err as any).isAxiosError))

afterEach(() => {
  cleanup()
  mockedGet.mockReset()
})

// Helper component
function HookTester({ filters, token }: { filters: Filters; token: string }) {
  const { payments, total, loading, error, validationErrors } =
    useAdminPayments(filters, token)
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="error">{error ?? ''}</div>
      <div data-testid="total">{total}</div>
      <ul data-testid="payments">{payments.map((p: any) => <li key={p.uuid}>{p.uuid}</li>)}</ul>
      <div data-testid="validation">
        {validationErrors ? JSON.stringify(validationErrors) : ''}
      </div>
    </div>
  )
}

describe('useAdminPayments', () => {
  const token = 'tkn'
  const baseFilters: Filters = {
    q: '',
    status: '',
    payment_method: '',
    per_page: 10,
    page: 1,
  }

  it('envoie status et payment_method quand présents', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [], meta: { total: 0 } },
    })

    const filters: Filters = {
      ...baseFilters,
      status: 'pending',
      payment_method: 'stripe',
    }

    render(<HookTester filters={filters} token={token} />)

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    expect(mockedGet).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/payments`,
      expect.objectContaining({
        params: expect.objectContaining({
          status: 'pending',
          payment_method: 'stripe',
        }),
      })
    )
  })

  it('gère une erreur non-Axios (isAxiosError=false)', async () => {
    const err: any = new Error('boom')        // <— annotation any
    err.isAxiosError = false                  // Simuler isAxiosError => false
    mockedGet.mockRejectedValueOnce(err)

    render(<HookTester filters={baseFilters} token={token} />)

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    )

    // Comme isAxiosError=false, on tombe direct dans setError(err.code)
    // err.code est undefined => on affiche chaîne vide
    expect(screen.getByTestId('error')).toHaveTextContent('')
  })

  // autres tests déjà existants...

  it('fetches data successfully', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [{ uuid: 'X1' }], meta: { total: 7 } },
    })
    render(<HookTester filters={baseFilters} token={token} />)
    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('total')).toHaveTextContent('7')
    expect(screen.getByTestId('payments')).toHaveTextContent('X1')
  })

  it('enforces per_page ≥ 1', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [], meta: { total: 0 } },
    })
    render(<HookTester filters={{ ...baseFilters, per_page: 0 }} token={token} />)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(mockedGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ params: expect.objectContaining({ per_page: 1 }) })
    )
  })

  it('handles validation error 422', async () => {
    const validation = { amount: ['too small'] }
    const err: any = new Error('422')
    err.response = { status: 422, data: { errors: validation } }
    err.isAxiosError = true
    mockedGet.mockRejectedValueOnce(err)
    render(<HookTester filters={baseFilters} token={token} />)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('validation')).toHaveTextContent(JSON.stringify(validation))
    expect(screen.getByTestId('error')).toHaveTextContent('')
  })

  it('handles 404 by clearing list', async () => {
    const err: any = new Error('404')
    err.response = { status: 404 }
    err.isAxiosError = true
    mockedGet.mockRejectedValueOnce(err)
    render(<HookTester filters={baseFilters} token={token} />)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('total')).toHaveTextContent('0')
    expect(screen.getByTestId('payments')).toBeEmptyDOMElement()
  })

  it('handles other axios errors', async () => {
    const err: any = new Error('fail')
    err.code = 'ECONNABORTED'
    err.response = { status: 500 }
    err.isAxiosError = true
    mockedGet.mockRejectedValueOnce(err)
    render(<HookTester filters={baseFilters} token={token} />)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('error')).toHaveTextContent('ECONNABORTED')
  })

  it('refetches when filters change', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: { data: [], meta: { total: 0 } } })
      .mockResolvedValueOnce({ data: { data: [{ uuid: 'Y2' }], meta: { total: 1 } } })

    const { rerender } = render(<HookTester filters={baseFilters} token={token} />)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    rerender(<HookTester filters={{ ...baseFilters, q: 'search' }} token={token} />)
    await waitFor(() => expect(screen.getByTestId('payments')).toHaveTextContent('Y2'))
    expect(mockedGet).toHaveBeenCalledTimes(2)
  })
})
