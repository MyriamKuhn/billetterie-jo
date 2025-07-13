import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
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

  it('désactive Create si invalid et l’active quand valide', async () => {
    // --- mock des trois appels axios.get nécessaires ---
    const fakeUser = { id:1, firstname:'John', lastname:'Doe', email:'john@x', role:'user' }
    const fakeProduct = {
      id:2, name:'BilletTest', stock_quantity:5,
      product_details:{ places:10, date:'2025-08-01', time:'18:00', location:'Paris' }
    }
    axiosGetMock
      // GET /users/1
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      // GET /users?email=...
      .mockResolvedValueOnce({ data: { data: { users: [fakeUser] } } })
      // GET /products/2
      .mockResolvedValueOnce({ data: { data: fakeProduct } })

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)

    const btn = screen.getByRole('button', { name: 'freeTicket.create' })
    expect(btn).toBeDisabled()

    // 1) Saisie userId → on a désormais une vraie preview
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument())
    expect(btn).toBeDisabled()

    // 2) Saisie productId → on a la preview produit
    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '2' } })
    await waitFor(() => expect(screen.getByText('BilletTest')).toBeInTheDocument())
    expect(btn).toBeEnabled()

    // 3) quantity = 0 → désactivé
    fireEvent.change(screen.getByTestId('freeTicket.quantity'), { target: { value: '0' } })
    expect(btn).toBeDisabled()
  })

  it('désactive Create si stock_quantity <= 0', async () => {
  // mock produit en rupture de stock
  ;(axios.get as any)
    // premier appel pour /users/1
    .mockResolvedValueOnce({ data: { user: { id:1, firstname:'A', lastname:'B', email:'a@x' } } })
    // deuxième pour lookup email
    .mockResolvedValueOnce({ data: { data: { users: [{ id:1, firstname:'A', lastname:'B', email:'a@x', role:'user' }] } } })
    // troisième pour /products/2 avec stock 0
    .mockResolvedValueOnce({ data: { data: { 
      id:2, name:'ProdRupture', stock_quantity:0,
      product_details:{ places:5, date:'2025-08-01', time:'12:00', location:'Paris' }
    } } })

  render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
  const btn = screen.getByRole('button', { name: 'freeTicket.create' })

  // on charge user
  fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
  await waitFor(() => expect(screen.getByText('A B')).toBeInTheDocument())

  // on charge produit
  fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '2' } })
  await waitFor(() => expect(screen.getByText('ProdRupture')).toBeInTheDocument())

  // stock = 0 → bouton reste désactivé
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
    // 1) Mock de l’API pour que user et product se chargent
    const fakeUser = { id:1, firstname:'John', lastname:'Doe', email:'john@x', role:'user' }
    const fakeProduct = {
      id:2, name:'BilletTest', stock_quantity:5,
      product_details:{ places:10, date:'2025-08-01', time:'18:00', location:'Paris' }
    }
    axiosGetMock
      // GET /users/1
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      // GET /users?email=...
      .mockResolvedValueOnce({ data: { data: { users: [fakeUser] } } })
      // GET /products/2
      .mockResolvedValueOnce({ data: { data: fakeProduct } })

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)

    // 2) Remplir et attendre les previews pour débloquer le bouton
    fireEvent.change(screen.getByTestId('freeTicket.userId'), {
      target: { value: '1' }
    })
    await waitFor(() => expect(screen.queryByTestId('loader')).not.toBeInTheDocument())
    expect(screen.getByText('John Doe')).toBeInTheDocument()

    fireEvent.change(screen.getByTestId('freeTicket.productId'), {
      target: { value: '2' }
    })
    await waitFor(() => expect(screen.queryByTestId('loader')).not.toBeInTheDocument())
    expect(screen.getByText('BilletTest')).toBeInTheDocument()

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

  it('désactive Create si quantity > stock_quantity', async () => {
    // 1) mock des appels user / lookup email / product
    const fakeUser = { id:1, firstname:'John', lastname:'Doe', email:'john@x', role:'user' }
    const fakeProduct = {
      id:2,
      name:'BilletTest',
      stock_quantity: 3,            // stock à 3 places
      product_details: {
        places: 3,
        date: '2025-08-01',
        time: '18:00',
        location: 'Paris',
      }
    }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })                 // GET /users/1
      .mockResolvedValueOnce({ data: { data: { users: [fakeUser] } } })   // GET /users?email=...
      .mockResolvedValueOnce({ data: { data: fakeProduct } })             // GET /products/2

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)

    // 2) remplir userId et attendre preview
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument())

    // 3) remplir productId et attendre preview
    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '2' } })
    await waitFor(() => expect(screen.getByText('BilletTest')).toBeInTheDocument())

    // 4) mettre quantity à 4 (> stock 3)
    const qtyInput = screen.getByTestId('freeTicket.quantity') as HTMLInputElement
    fireEvent.change(qtyInput, { target: { value: '4' } })
    expect(qtyInput.value).toBe('4')

    // 5) le bouton reste désactivé car 4 > 3
    const btn = screen.getByRole('button', { name: /freeTicket.create/i })
    expect(btn).toBeDisabled()
  })

  it('désactive Create si product.stock_quantity est undefined (fallback 0) et quantity > 0', async () => {
    // 1) mock user details & lookup email
    const fakeUser = { id:1, firstname:'John', lastname:'Doe', email:'john@x', role:'user' }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })               // GET /users/1
      .mockResolvedValueOnce({ data: { data: { users: [fakeUser] } } }) // GET /users?email=...

    // 2) mock product fetch qui renvoie un produit sans stock_quantity
    const fakeProductPartial = {
      id: 2,
      name: 'ProduitSansStock',
      // pas de stock_quantity ici
      product_details: {
        places: 5,
        date: '2025-08-01',
        time: '12:00',
        location: 'Paris',
      }
    }
    axiosGetMock.mockResolvedValueOnce({ data: { data: fakeProductPartial } }) // GET /products/2

    // 3) render
    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />)

    // 4) remplir userId et attendre la preview user
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument())

    // 5) remplir productId et attendre la preview produit
    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '2' } })
    await waitFor(() => expect(screen.getByText('ProduitSansStock')).toBeInTheDocument())

    // 6) quantity par défaut = 1 > (undefined ?? 0) → bouton désactivé
    const btn = screen.getByRole('button', { name: /freeTicket.create/i })
    expect(btn).toBeDisabled()
  })

  it('désactive Create si user chargé mais pas de produit (fallback stock 0)', async () => {
    // 1) mock des deux appels user / lookup email
    const fakeUser = { id:1, firstname:'John', lastname:'Doe', email:'john@x', role:'user' }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })               // GET /users/1
      .mockResolvedValueOnce({ data: { data: { users: [fakeUser] } } }) // GET /users?email=...

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)

    // 2) remplir userId et attendre la preview utilisateur
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument())

    // 3) ne PAS renseigner productId (product reste null), quantity = 1 par défaut
    //    → (product?.stock_quantity ?? 0) === 0 et 1 > 0 ⇒ bouton désactivé
    const btn = screen.getByRole('button', { name: /freeTicket.create/i })
    expect(btn).toBeDisabled()
  })

  it('désactive Create si productId renseigné mais produit fetché est undefined (fallback stock 0)', async () => {
    // 1) mock les appels user / lookup email
    const fakeUser = { id:1, firstname:'John', lastname:'Doe', email:'john@x', role:'user' };
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })               // GET /users/1
      .mockResolvedValueOnce({ data: { data: { users: [fakeUser] } } }); // GET /users?email=...

    // 2) mock l’appel produit qui renvoie data.data undefined
    axiosGetMock.mockResolvedValueOnce({ data: { data: undefined } });    // GET /products/2

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>);

    // 3) on remplit userId → preview user
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } });
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    // 4) on remplit productId → fetch produit “vide”
    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '2' } });

    // 5) on vérifie que le bouton reste désactivé
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /freeTicket.create/i });
      expect(btn).toBeDisabled();
    });
  });

  it('affiche noDetails par défaut quand ni user ni product n’ont été renseignés', () => {
    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />);

    // On est en début de modal, pas de chargement, pas d’erreur, pas de user ni product
    expect(screen.getByText('freeTicket.noDetails')).toBeInTheDocument();
  });

  it('refetches product when locale changes', async () => {
    // 1) Préparez deux réponses successives pour /products/2
    const fakeProduct = {
      id: 2,
      name: 'MonProduit',
      stock_quantity: 10,
      product_details: {
        places: 10,
        date: '2025-09-01',
        time: '20:00',
        location: 'Lyon',
      },
    };
    const axiosGetMock = axios.get as unknown as ReturnType<typeof vi.fn>;
    axiosGetMock
      // premier appel pour productId=2 avec locale 'fr'
      .mockResolvedValueOnce({ data: { data: fakeProduct } })
      // deuxième appel pour même productId avec locale 'en'
      .mockResolvedValueOnce({ data: { data: fakeProduct } });

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />);

    // 2) On renseigne productId pour déclencher le premier fetch
    fireEvent.change(screen.getByTestId('freeTicket.productId'), {
      target: { value: '2' },
    });
    await waitFor(() => {
      expect(screen.getByText('MonProduit')).toBeInTheDocument();
    });
    expect(axiosGetMock).toHaveBeenCalledTimes(1);
    // on vérifie le header initial
    const [, firstConfig] = axiosGetMock.mock.calls[0];
    expect(firstConfig.headers['Accept-Language']).toBe('fr');

    // 3) On change la locale en 'en'
    const radios = screen.getByTestId('freeTicket.locale');
    const enInput = within(radios).getByDisplayValue('en');
    fireEvent.click(enInput);

    // 4) On attend le 2ᵉ fetch et on vérifie le nouveau header
    await waitFor(() => {
      expect(axiosGetMock).toHaveBeenCalledTimes(2);
    });
    const [, secondConfig] = axiosGetMock.mock.calls[1];
    expect(secondConfig.headers['Accept-Language']).toBe('en');
  });

  it('affiche le loader pendant le chargement du produit', async () => {
    const axiosGetMock = axios.get as unknown as ReturnType<typeof vi.fn>;

    // 1) Premier appel (user) renvoie un user « vide » pour ne pas déclencher loadingUser
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: { id: 1, firstname:'X', lastname:'Y', email:'x@y' } } })
      .mockResolvedValueOnce({ data: { data: { users: [{ id:1, firstname:'X', lastname:'Y', email:'x@y', role:'user' }] } } });

    // 2) Troisième appel (produit) ne résout jamais -> loadingProduct = true
    axiosGetMock.mockReturnValueOnce(new Promise(() => {}));

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />);

    // Remplir userId pour que loadingUser disparaisse
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } });
    await waitFor(() => expect(screen.queryByTestId('loader')).not.toBeInTheDocument());

    // Lancer le fetch produit qui reste pendu
    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '42' } });

    // On doit voir le loader produit
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('traite un usersList non-array comme “user_not_found”', async () => {
    const axiosGetMock = axios.get as unknown as ReturnType<typeof vi.fn>;
    const fakeUser = { id:1, firstname:'Z', lastname:'Q', email:'z@q' };

    // 1) GET /users/1 → renvoie l’utilisateur OK
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      // 2) GET /users?email=… → renvoie users non-array
      .mockResolvedValueOnce({ data: { data: { users: null } } });

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>);

    // on déclenche le premier useEffect
    fireEvent.change(screen.getByTestId('freeTicket.userId'), {
      target: { value: '1' },
    });

    // on doit retomber dans le else du lookup
    await waitFor(() => {
      expect(screen.getByText('errors.user_not_found')).toBeInTheDocument();
    });

    // et s'assurer qu'on a bien appelé logError ? non, ici c'est dans le .then,
    // donc pas de logError, mais l'erreur affichée.
  });
})
