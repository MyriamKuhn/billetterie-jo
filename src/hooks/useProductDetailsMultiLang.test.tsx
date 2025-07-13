import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import {
  useProductDetailsMultiLang,
  type LangCode
} from './useProductDetailsMultiLang'

// Petit wrapper pour exposer le hook dans le DOM
function HookTester({
  productId,
  langs,
}: {
  productId: number | null
  langs: LangCode[]
}) {
  const { data, loading, error } = useProductDetailsMultiLang(
    productId,
    langs
  )
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="error">{error ?? ''}</div>
      <div data-testid="data">
        {data ? JSON.stringify(data) : ''}
      </div>
    </div>
  )
}

describe('useProductDetailsMultiLang', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('quand productId est null, ne fait rien et renvoie data=null, loading=false, error=null', () => {
    render(<HookTester productId={null} langs={['fr', 'en']} />)
    expect(screen.getByTestId('loading').textContent).toBe('false')
    expect(screen.getByTestId('error').textContent).toBe('')
    expect(screen.getByTestId('data').textContent).toBe('')
  })

  it('sur succès, appelle axios.get pour chaque langue et retourne les données dans l’ordre', async () => {
    const fakeFr = { id: 1, name: 'Produit FR' }
    const fakeEn = { id: 1, name: 'Product EN' }
    // on stub axios.get pour renvoyer deux fois un resolved promise
    vi.spyOn(axios, 'get')
      .mockResolvedValueOnce({ data: { data: fakeFr } })
      .mockResolvedValueOnce({ data: { data: fakeEn } })

    render(<HookTester productId={42} langs={['fr', 'en']} />)

    // doit d’abord passer par loading=true
    expect(screen.getByTestId('loading').textContent).toBe('true')

    // attend la fin du fetch
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )

    // pas d’erreur
    expect(screen.getByTestId('error').textContent).toBe('')

    // data doit être un objet { fr: fakeFr, en: fakeEn }
    const data = JSON.parse(screen.getByTestId('data').textContent!) as Record<
      LangCode,
      typeof fakeFr
    >
    expect(data).toEqual({ fr: fakeFr, en: fakeEn })
  })

  it('sur erreur Axios avec message dans response.data.message, setError à ce message', async () => {
    // Simule une erreur Axios avec isAxiosError=true et response.data.message
    const axiosErr = Object.assign(new Error('ignored'), {
      isAxiosError: true,
      response: { data: { message: 'Not allowed' } },
    })
    vi.spyOn(axios, 'get').mockRejectedValueOnce(axiosErr)

    render(<HookTester productId={99} langs={['de']} />)

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )

    // l’erreur doit venir de response.data.message
    expect(screen.getByTestId('error').textContent).toBe('Not allowed')
    // data reste null
    expect(screen.getByTestId('data').textContent).toBe('')
  })

  it('sur erreur non-Axios ou sans response.data.message, setError à err.message', async () => {
    const plainErr = new Error('Network down')
    vi.spyOn(axios, 'get').mockRejectedValueOnce(plainErr)

    render(<HookTester productId={7} langs={['fr']} />)

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )

    expect(screen.getByTestId('error').textContent).toBe('Network down')
    expect(screen.getByTestId('data').textContent).toBe('')
  })
})
