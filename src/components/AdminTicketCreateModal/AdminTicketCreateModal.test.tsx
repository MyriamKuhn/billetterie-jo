import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import axios from 'axios'

import { AdminTicketCreateModal } from './AdminTicketCreateModal'
import { logError } from '../../utils/logger'

// --- MOCKS ------------------------------------------------
vi.mock('../../stores/useAuthStore', () => ({
  useAuthStore: (selector: (state: { authToken: string }) => any) => {
    // on simule un state contenant authToken
    return selector({ authToken: 'dummy-token' })
  }
}))
// 1) axios : on expose directement get
vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}))

// 2) notifyMock unique
const notifyMock = vi.fn()
vi.mock('../../hooks/useCustomSnackbar', () => ({
  useCustomSnackbar: () => ({ notify: notifyMock })
}))

// translation renvoie juste la clé
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (s: string) => s })
}))

// useFreeTicket mocké
const freeTicketMock = vi.fn()
vi.mock('../../hooks/useFreeTicket', () => ({
  useFreeTicket: () => freeTicketMock
}))

// FilterField / FilterRadios / OlympicLoader comme avant...
vi.mock('../FilterField', () => ({
  FilterField: ({ label, value, onChange }: any) => (
    <input data-testid={label} value={value} onChange={e => onChange(e.target.value)} />
  )
}))
vi.mock('../FilterRadios/FilterRadios', () => ({
  FilterRadios: ({ legend, value, options, onChange }: any) => (
    <div data-testid={legend}>
      {options.map((opt: any) => (
        <label key={opt.value}>
          <input
            type="radio"
            name={legend}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  )
}))
vi.mock('../OlympicLoader', () => ({
  default: () => <div data-testid="loader" />
}))
vi.mock('../../config', () => ({ API_BASE_URL: 'http://api' }))
vi.mock('../../utils/logger', () => ({
  logError: vi.fn()
}))
// -----------------------------------------------------------

describe('AdminTicketCreateModal', () => {
  const onClose = vi.fn()
  const onRefresh = vi.fn()

  const axiosGetMock = (axios.get as unknown as ReturnType<typeof vi.fn>)

  beforeEach(() => {
    vi.clearAllMocks()
    // axios.get par défaut résolu pour ne pas casser les .then()
    axiosGetMock.mockResolvedValue({ data: {} })
    freeTicketMock.mockResolvedValue(true)
  })

  it('ne render rien quand open=false', () => {
    const { container } = render(
      <AdminTicketCreateModal open={false} onClose={onClose} onRefresh={onRefresh}/>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('render champs & boutons quand open=true', () => {
    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    expect(screen.getByTestId('freeTicket.userId')).toBeInTheDocument()
    expect(screen.getByTestId('freeTicket.productId')).toBeInTheDocument()
    expect(screen.getByTestId('freeTicket.quantity')).toBeInTheDocument()
    expect(screen.getByTestId('freeTicket.locale')).toBeInTheDocument()
    expect(screen.getByText('freeTicket.cancel')).toBeInTheDocument()
    expect(screen.getByText('freeTicket.create')).toBeInTheDocument()
  })

  it('désactive Create si invalid et l’active quand valide', () => {
    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    const btn = screen.getByText('freeTicket.create')
    expect(btn).toBeDisabled()

    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
    expect(btn).toBeDisabled()

    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '2' } })
    // quantité par défaut = 1, tout est valide
    expect(btn).toBeEnabled()

    fireEvent.change(screen.getByTestId('freeTicket.quantity'), { target: { value: '0' } })
    expect(btn).toBeDisabled()
  })

  it('fetch user puis affiche preview user', async () => {
    const fakeUser = { id:1, firstname:'A', lastname:'B', email:'a@x' }
    // 1er appel GET /users/1
    ;(axios.get as any)
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      // 2e appel GET /users?email=...
      .mockResolvedValueOnce({ data: { data: { users:[{ ...fakeUser, role:'user' }] } } })

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })

    await waitFor(() => {
      expect(screen.getByText('freeTicket.user')).toBeInTheDocument()
      expect(screen.getByText('A B')).toBeInTheDocument()
      expect(screen.getByText('a@x')).toBeInTheDocument()
    })
  })

  it('fetch user error affiche message', async () => {
    ;(axios.get as any).mockRejectedValueOnce(new Error('fail'))
    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '99' } })
    await waitFor(() => {
      expect(screen.getByText('errors.user_not_found')).toBeInTheDocument()
    })
  })

  it('fetch product puis affiche preview product', async () => {
    const fakeProd = {
      id:2, name:'ProdX',
      product_details:{ places:5, date:'2025-08-01', time:'12:00', location:'Paris' }
    }
    ;(axios.get as any).mockResolvedValueOnce({ data:{ data: fakeProd } })

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '2' } })

    await waitFor(() => {
      expect(screen.getByText('freeTicket.product')).toBeInTheDocument()
      expect(screen.getByText('ProdX')).toBeInTheDocument()
      // on vérifie la clé freeTicket.places plutôt que le nombre "5"
      expect(screen.getByText('freeTicket.places')).toBeInTheDocument()
      // formatDate(...,'fr') -> "1 août 2025 - 12:00"
      expect(screen.getByText('1 août 2025 - 12:00')).toBeInTheDocument()
      expect(screen.getByText('Paris')).toBeInTheDocument()
    })
  })

  it('show loader pendant loadingUser', () => {
    // axios.get renvoie une Promise qui ne résout jamais -> loadingUser = true
    (axios.get as any).mockReturnValueOnce(new Promise(() => {}))

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('handleSubmit appelle freeTicket et notifie success & error', async () => {
    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '2' } })
    fireEvent.change(screen.getByTestId('freeTicket.quantity'), { target: { value: '1' } })

    const btn = screen.getByText('freeTicket.create')

    // succès
    freeTicketMock.mockResolvedValueOnce(true)
    fireEvent.click(btn)
    await waitFor(() => {
      expect(notifyMock).toHaveBeenCalledWith('freeTicket.success', 'success')
      expect(onRefresh).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })

    // échec
    freeTicketMock.mockResolvedValueOnce(false)
    fireEvent.click(btn)
    await waitFor(() => {
      expect(notifyMock).toHaveBeenCalledWith('errors.save_failed', 'error')
    })
  })

  // 1) role !== 'user'
  it('affiche only_users_allowed et remet user à null si role non-user', async () => {
    const fakeUser = { id: 1, firstname: 'X', lastname: 'Y', email: 'x@y' }
    // 1er appel : user details
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      // 2e appel : email lookup with role = 'admin'
      .mockResolvedValueOnce({ data: { data: { users: [{ ...fakeUser, role: 'admin' }] } } })

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })

    await waitFor(() => {
      expect(screen.getByText('errors.only_users_allowed')).toBeInTheDocument()
    })
  })

  // 2) liste vide
  it('affiche user_not_found si lookup email renvoie []', async () => {
    const fakeUser = { id: 2, firstname: 'A', lastname: 'B', email: 'a@b' }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      // lookup renvoie tableau vide
      .mockResolvedValueOnce({ data: { data: { users: [] } } })

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '2' } })

    await waitFor(() => {
      expect(screen.getByText('errors.user_not_found')).toBeInTheDocument()
    })
  })

  // 3) catch dans user check
  it('logError et affiche user_not_found si email lookup throw', async () => {
    const fakeUser = { id: 3, firstname: 'C', lastname: 'D', email: 'c@d' }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      // deuxième appel rejette
      .mockRejectedValueOnce(new Error('oops'))

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '3' } })

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith('AdminTicketCreateModalUserCheck', expect.any(Error))
      expect(screen.getByText('errors.user_not_found')).toBeInTheDocument()
    })
  })

  // 4) catch dans product fetch
  it('logError et affiche product_not_found si product fetch throw', async () => {
    // 1er appel sur userId ne se déclenche pas ici, on stub direct product reject
    axiosGetMock.mockRejectedValueOnce(new Error('bad prod'))

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '99' } })

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith('AdminTicketCreateModalProductDetails', expect.any(Error))
      expect(screen.getByText('errors.product_not_found')).toBeInTheDocument()
    })
  })

  describe('Parsing des champs & garde-fous', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      // axios.get ne bloque pas nos effect hooks
      axiosGetMock.mockResolvedValue({ data: {} })
      freeTicketMock.mockResolvedValue(true)
    })

    it('vide userId si on entre une chaîne non-numérique', () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
      const userInput = screen.getByTestId('freeTicket.userId') as HTMLInputElement
      fireEvent.change(userInput, { target: { value: 'abc' } })
      // value redevient la chaîne vide
      expect(userInput.value).toBe('')
    })

    it('vide productId si on entre une chaîne non-numérique', () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
      const prodInput = screen.getByTestId('freeTicket.productId') as HTMLInputElement
      fireEvent.change(prodInput, { target: { value: 'xyz' } })
      expect(prodInput.value).toBe('')
    })

    it('ramène quantity à 0 si on entre une chaîne non-numérique', () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
      const qtyInput = screen.getByTestId('freeTicket.quantity') as HTMLInputElement
      fireEvent.change(qtyInput, { target: { value: 'foo' } })
      expect(qtyInput.value).toBe('0')
    })

    it('n’appelle pas freeTicket si handleSubmit est cliqué malgré userId ou productId manquants', () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
      // on renseigne productId mais pas userId
      fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '5' } })
      // quantity ok
      fireEvent.change(screen.getByTestId('freeTicket.quantity'), { target: { value: '2' } })

      // le bouton est désactivé, mais on explicitement enlève l'attribut disabled pour forcer le click
      const btn = screen.getByText('freeTicket.create') as HTMLButtonElement
      btn.removeAttribute('disabled')
      fireEvent.click(btn)

      expect(freeTicketMock).not.toHaveBeenCalled()
      expect(notifyMock).not.toHaveBeenCalled()
    })
  })

  describe('AdminTicketCreateModal – parsing des champs', () => {
    const onClose = vi.fn()
    const onRefresh = vi.fn()
    beforeEach(() => {
      vi.clearAllMocks()
      // rendre freeTicket toujours résolu à true pour simplifier
      freeTicketMock.mockReturnValue(vi.fn().mockResolvedValue(true))
      // rendre axios.get neutre pour que user/product ne se chargent pas
      vi.mocked(axios.get).mockResolvedValue({ data: { data: { users: [], user: {}, data: {} } } })
    })

    it('tape un userId non-numérique => value "", prévisu « noDetails »', async () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />)
      const userInput = screen.getByTestId('freeTicket.userId') as HTMLInputElement

      // on entre « abc » dans le champ userId
      fireEvent.change(userInput, { target: { value: 'abc' } })
      // l’état userId devient null -> value du champ retombe à ""
      await waitFor(() => expect(userInput.value).toBe(''))
      // et comme ni user ni product n’existent, on est en mode « noDetails »
      expect(screen.getByText(/noDetails/)).toBeInTheDocument()
    })

    it('tape un productId non-numérique => value "", prévisu « noDetails »', async () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />)
      const prodInput = screen.getByTestId('freeTicket.productId') as HTMLInputElement

      fireEvent.change(prodInput, { target: { value: 'foo' } })
      await waitFor(() => expect(prodInput.value).toBe(''))
      expect(screen.getByText(/noDetails/)).toBeInTheDocument()
    })

    it('tape une quantity non-numérique => value "0" et bouton Create désactivé', async () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />)
      const qtyInput = screen.getByTestId('freeTicket.quantity') as HTMLInputElement
      const createBtn = screen.getByRole('button', { name: /create/ })

      fireEvent.change(qtyInput, { target: { value: 'zzz' } })
      await waitFor(() => expect(qtyInput.value).toBe('0'))

      // comme quantity <= 0, Create reste désactivé
      expect(createBtn).toBeDisabled()
    })
  })

  it('utilise le token retourné par useAuthStore dans les headers axios', async () => {
    // Arrange
    const fakeUser = { id: 7, firstname: 'T', lastname: 'E', email: 't@e' }
    // on mock le premier get (/users/7) pour qu’il résolve
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      // puis le lookup email
      .mockResolvedValueOnce({ data: { data: { users: [{ ...fakeUser, role: 'user' }] } } })

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)

    // Act : déclenche le useEffect(userId)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '7' } })

    // On attend que le 1er appel axios soit fait
    await waitFor(() => {
      expect(axiosGetMock).toHaveBeenCalled()
    })

    // Assert : le premier appel doit contenir dans son 2ᵉ argument le header Authorization
    const [[_url1, config1]] = axiosGetMock.mock.calls
    expect(config1.headers).toMatchObject({
      Authorization: 'Bearer dummy-token',      // ou 'dummy-token' selon ton mock
      'Accept-Language': 'fr'
    })
  })

  it('injecte le Bearer token dans les headers d’axios.get', async () => {
    // on prépare un user factice pour que le useEffect(userId) fasse un axios.get
    const fakeUser = { id: 42, firstname: 'X', lastname: 'Y', email: 'x@y' }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })          // GET /users/42
      .mockResolvedValueOnce({ data: { data: { users: [{ ...fakeUser, role: 'user' }] } } }) // lookup email

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)

    // on module le champ userId pour déclencher le premier axios.get
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '42' } })

    // on attend que l’effet ait appelé axios.get au moins une fois
    await waitFor(() => expect(axiosGetMock).toHaveBeenCalled())

    // on récupère le premier appel
    const [calledUrl, calledConfig] = axiosGetMock.mock.calls[0]

    // l’URL est bien celle de l’API...
    expect(calledUrl).toBe('http://api/api/users/42')

    // … et dans les headers on retrouve notre token
    expect(calledConfig).toMatchObject({
      headers: {
        Authorization: 'Bearer dummy-token',
        'Accept-Language': 'fr'
      }
    })
  })
})
