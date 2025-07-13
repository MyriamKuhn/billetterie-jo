import { render, screen, waitFor } from '@testing-library/react'
import axios, { AxiosError } from 'axios'
import { describe, it, beforeEach, vi, expect, type MockedFunction } from 'vitest'
import { API_BASE_URL } from '../config'
import type { Product } from '../types/products'
import type { Filters } from './useAdminProducts'
import { useAdminProducts } from './useAdminProducts'

// ──────── 1) MOCK D'AXIOS ────────────────────────────────────────────────────
// On mocke axios.get et on stub axios.isAxiosError pour qu'il renvoie toujours true
vi.mock('axios')
const mockedGet = axios.get as unknown as MockedFunction<typeof axios.get>
;(axios as any).isAxiosError = (_err: any): _err is AxiosError => true

// ──────── 2) Composant de test qui expose l'état du hook ──────────────────────
function TestComponent({
  filters,
  lang,
  token,
}: {
  filters: Filters
  lang: string
  token: string
}) {
  const { products, total, loading, error, validationErrors } =
    useAdminProducts(filters, lang, token)

  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="error">{error ?? ''}</div>
      <div data-testid="total">{total}</div>
      <div data-testid="products">{products.map((p) => p.id).join(',')}</div>
      <div data-testid="validation">
        {validationErrors ? JSON.stringify(validationErrors) : ''}
      </div>
    </div>
  )
}

const defaultFilters: Filters = {
  name: '',
  category: '',
  location: '',
  date: '',
  places: 0,
  sortBy: 'name',
  order: 'asc',
  perPage: 10,
  page: 1,
}
const defaultLang = 'en'
const defaultToken = 'mytoken'

describe('useAdminProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('→ succès : charge products et total', async () => {
    const fakeProducts: Product[] = [{ id: 1, name: 'A', price: 1 } as any]
    const fakeTotal = 123
    mockedGet.mockResolvedValueOnce({
      data: { data: fakeProducts, pagination: { total: fakeTotal } },
    })

    render(
      <TestComponent
        filters={defaultFilters}
        lang={defaultLang}
        token={defaultToken}
      />
    )

    // loading passe de true → false
    expect(screen.getByTestId('loading').textContent).toBe('true')
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )

    // Vérifie l'appel avec bons params par défaut
    expect(mockedGet).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/products/all`,
      expect.objectContaining({
        params: expect.objectContaining({
          per_page: 10,
          page: 1,
          sort_by: 'name',
          order: 'asc',
        }),
        headers: expect.objectContaining({
          Authorization: `Bearer ${defaultToken}`,
          'Accept-Language': defaultLang,
        }),
      })
    )

    expect(screen.getByTestId('products').textContent).toBe('1')
    expect(screen.getByTestId('total').textContent).toBe(fakeTotal.toString())
    expect(screen.getByTestId('error').textContent).toBe('')
    expect(screen.getByTestId('validation').textContent).toBe('')
  })

  it('→ inclut name, category, location, date et places dans params quand spécifiés', async () => {
    // On met tous les filtres optionnels
    const filtersWithAll: Filters = {
      ...defaultFilters,
      name: 'foo',
      category: 'bar',
      location: 'baz',
      date: '2025-01-01',
      places: 5,
    }

    // On renvoie un résultat vide pour que le hook termine
    mockedGet.mockResolvedValueOnce({
      data: { data: [], pagination: { total: 0 } },
    })

    render(
      <TestComponent
        filters={filtersWithAll}
        lang={defaultLang}
        token={defaultToken}
      />
    )

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )

    // Vérifie que l'appel axios inclut bien tous les champs de filtre
    expect(mockedGet).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/products/all`,
      expect.objectContaining({
        params: expect.objectContaining({
          name: 'foo',
          category: 'bar',
          location: 'baz',
          date: '2025-01-01',
          places: 5,
        }),
      })
    )
  })

  it('→ 422 validation error : validationErrors rempli, pas d’erreur générique', async () => {
    const validationErr = { name: ['required'] }
    const axiosErr = {
      isAxiosError: true,
      response: { status: 422, data: { errors: validationErr } },
    } as AxiosError
    mockedGet.mockRejectedValueOnce(axiosErr)

    render(
      <TestComponent
        filters={defaultFilters}
        lang={defaultLang}
        token={defaultToken}
      />
    )

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )

    expect(screen.getByTestId('products').textContent).toBe('')
    expect(screen.getByTestId('total').textContent).toBe('0')
    expect(screen.getByTestId('error').textContent).toBe('')
    expect(screen.getByTestId('validation').textContent).toBe(
      JSON.stringify(validationErr)
    )
  })

  it('→ 404 not found : vide, pas d’erreur', async () => {
    const axiosErr = {
      isAxiosError: true,
      response: { status: 404 },
    } as AxiosError
    mockedGet.mockRejectedValueOnce(axiosErr)

    render(
      <TestComponent
        filters={defaultFilters}
        lang={defaultLang}
        token={defaultToken}
      />
    )

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )

    expect(screen.getByTestId('products').textContent).toBe('')
    expect(screen.getByTestId('total').textContent).toBe('0')
    expect(screen.getByTestId('error').textContent).toBe('')
    expect(screen.getByTestId('validation').textContent).toBe('')
  })

  it('→ autre erreur Axios : error.code affiché', async () => {
    const axiosErr = {
      isAxiosError: true,
      code: 'ECONNABORTED',
      response: undefined,
    } as AxiosError
    mockedGet.mockRejectedValueOnce(axiosErr)

    render(
      <TestComponent
        filters={defaultFilters}
        lang={defaultLang}
        token={defaultToken}
      />
    )

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )

    expect(screen.getByTestId('error').textContent).toBe('ECONNABORTED')
    expect(screen.getByTestId('validation').textContent).toBe('')
  })

  it('→ relance fetch quand filters ou lang changent', async () => {
    const prodA: Product[] = [{ id: 1, name: 'A', price: 1 } as any]
    const prodB: Product[] = [{ id: 2, name: 'B', price: 2 } as any]

    // 1er appel
    mockedGet.mockResolvedValueOnce({
      data: { data: prodA, pagination: { total: 1 } },
    })

    const { rerender } = render(
      <TestComponent
        filters={defaultFilters}
        lang="en"
        token={defaultToken}
      />
    )
    await waitFor(() =>
      expect(screen.getByTestId('products').textContent).toBe('1')
    )

    // 2e appel après changement de lang
    mockedGet.mockResolvedValueOnce({
      data: { data: prodB, pagination: { total: 1 } },
    })
    await rerender(
      <TestComponent
        filters={defaultFilters}
        lang="fr"
        token={defaultToken}
      />
    )
    await waitFor(() =>
      expect(screen.getByTestId('products').textContent).toBe('2')
    )
  })

  it('gère les erreurs non-Axios en affichant err.code', async () => {
    // On force axios.isAxiosError à renvoyer false
    ;(axios as any).isAxiosError = () => false

    // On rejette avec un objet qui n’est pas un AxiosError
    mockedGet.mockRejectedValueOnce({ code: 'E_NON_AXIOS' })

    render(
      <TestComponent
        filters={defaultFilters}
        lang={defaultLang}
        token={defaultToken}
      />
    )

    // Attend la fin du loading
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )

    // Puis on doit voir err.code affiché
    expect(screen.getByTestId('error').textContent).toBe('E_NON_AXIOS')
    // Et pas de validationErrors
    expect(screen.getByTestId('validation').textContent).toBe('')
  })
})
