import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import axios from 'axios'

import { AdminTicketCreateModal } from './AdminTicketCreateModal'
import { logError } from '../../utils/logger'

// --- MOCKS ------------------------------------------------
// Mock the auth token selector to always return “dummy-token”
vi.mock('../../stores/useAuthStore', () => ({
  useAuthStore: (selector: (state: { authToken: string }) => any) => {
    // on simule un state contenant authToken
    return selector({ authToken: 'dummy-token' })
  }
}))
// Mock axios.get so we can inspect and stub its calls
vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}))

// Single notify mock shared by all tests
const notifyMock = vi.fn()
vi.mock('../../hooks/useCustomSnackbar', () => ({
  useCustomSnackbar: () => ({ notify: notifyMock })
}))

// Stub translations: return the key itself
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (s: string) => s })
}))

// Mock the freeTicket hook to control its resolution in tests
const freeTicketMock = vi.fn()
vi.mock('../../hooks/useFreeTicket', () => ({
  useFreeTicket: () => freeTicketMock
}))

// Mock input components used in the modal
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
// Loader & config mocks
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
    // By default, all axios.get calls resolve to an empty object
    axiosGetMock.mockResolvedValue({ data: {} })
    // The freeTicket hook succeeds by default
    freeTicketMock.mockResolvedValue(true)
  })

  it('renders nothing when open=false', () => {
    const { container } = render(
      <AdminTicketCreateModal open={false} onClose={onClose} onRefresh={onRefresh}/>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders input fields and buttons when open=true', () => {
    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    // Check each of the expected testids for the three fields + locale selector
    expect(screen.getByTestId('freeTicket.userId')).toBeInTheDocument()
    expect(screen.getByTestId('freeTicket.productId')).toBeInTheDocument()
    expect(screen.getByTestId('freeTicket.quantity')).toBeInTheDocument()
    expect(screen.getByTestId('freeTicket.locale')).toBeInTheDocument()
    // Check Cancel and Create buttons by translation keys
    expect(screen.getByText('freeTicket.cancel')).toBeInTheDocument()
    expect(screen.getByText('freeTicket.create')).toBeInTheDocument()
  })

  it('enables Create button only when all inputs are valid', async () => {
    // Prepare three user/product fetch calls in order:
    // 1) GET /users/1
    // 2) lookup by email
    // 3) GET /products/2
    const fakeUser = { id:1, firstname:'John', lastname:'Doe', email:'john@x', role:'user' }
    const fakeProduct = {
      id:2, name:'BilletTest', stock_quantity:5,
      product_details:{ places:10, date:'2025-08-01', time:'18:00', location:'Paris' }
    }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      .mockResolvedValueOnce({ data: { data: { users: [fakeUser] } } })
      .mockResolvedValueOnce({ data: { data: fakeProduct } })

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)

    const btn = screen.getByRole('button', { name: 'freeTicket.create' })
    expect(btn).toBeDisabled()

    // 1) Enter userId → preview appears, but still disabled
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument())
    expect(btn).toBeDisabled()

    // 2) Enter productId → product preview appears, now enable
    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '2' } })
    await waitFor(() => expect(screen.getByText('BilletTest')).toBeInTheDocument())
    expect(btn).toBeEnabled()

    // 3) Enter quantity 0 → disable again
    fireEvent.change(screen.getByTestId('freeTicket.quantity'), { target: { value: '0' } })
    expect(btn).toBeDisabled()
  })

  it('disables Create if stock_quantity <= 0', async () => {
  // Simulate product out of stock
  ;(axios.get as any)
    .mockResolvedValueOnce({ data: { user: { id:1, firstname:'A', lastname:'B', email:'a@x' } } })
    .mockResolvedValueOnce({ data: { data: { users: [{ id:1, firstname:'A', lastname:'B', email:'a@x', role:'user' }] } } })
    .mockResolvedValueOnce({ data: { data: { 
      id:2, name:'ProdRupture', stock_quantity:0,
      product_details:{ places:5, date:'2025-08-01', time:'12:00', location:'Paris' }
    } } })

  render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
  const btn = screen.getByRole('button', { name: 'freeTicket.create' })

  fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
  await waitFor(() => expect(screen.getByText('A B')).toBeInTheDocument())

  fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '2' } })
  await waitFor(() => expect(screen.getByText('ProdRupture')).toBeInTheDocument())

  // Stock = 0 → remain disabled
  expect(btn).toBeDisabled()
  })

  it('fetches user and displays user preview', async () => {
    const fakeUser = { id:1, firstname:'A', lastname:'B', email:'a@x' }
    ;(axios.get as any)
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      .mockResolvedValueOnce({ data: { data: { users:[{ ...fakeUser, role:'user' }] } } })

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })

    await waitFor(() => {
      expect(screen.getByText('freeTicket.user')).toBeInTheDocument()
      expect(screen.getByText('A B')).toBeInTheDocument()
      expect(screen.getByText('a@x')).toBeInTheDocument()
    })
  })

  it('shows error message when fetching user fails', async () => {
    ;(axios.get as any).mockRejectedValueOnce(new Error('fail'))
    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '99' } })
    await waitFor(() => {
      expect(screen.getByText('errors.user_not_found')).toBeInTheDocument()
    })
  })

  it('fetches product and displays product preview', async () => {
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
      // Check that we show the places label
      expect(screen.getByText('freeTicket.places')).toBeInTheDocument()
      // And the formatted date/time
      expect(screen.getByText('1 août 2025 - 12:00')).toBeInTheDocument()
      expect(screen.getByText('Paris')).toBeInTheDocument()
    })
  })

  it('shows loader while user details are loading', () => {
    // Return a never‐resolving promise so loadingUser remains true
    (axios.get as any).mockReturnValueOnce(new Promise(() => {}))

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('handleSubmit calls freeTicket and notifies success & error', async () => {
    // Mock user & product fetch for button enable
    const fakeUser = { id:1, firstname:'John', lastname:'Doe', email:'john@x', role:'user' }
    const fakeProduct = {
      id:2, name:'BilletTest', stock_quantity:5,
      product_details:{ places:10, date:'2025-08-01', time:'18:00', location:'Paris' }
    }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      .mockResolvedValueOnce({ data: { data: { users: [fakeUser] } } })
      .mockResolvedValueOnce({ data: { data: fakeProduct } })

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)

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

    // Success path
    freeTicketMock.mockResolvedValueOnce(true)
    fireEvent.click(btn)
    await waitFor(() => {
      expect(notifyMock).toHaveBeenCalledWith('freeTicket.success', 'success')
      expect(onRefresh).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })

    // Failure path
    freeTicketMock.mockResolvedValueOnce(false)
    fireEvent.click(btn)
    await waitFor(() => {
      expect(notifyMock).toHaveBeenCalledWith('errors.save_failed', 'error')
    })
  })

  it('show only_users_allowed and reset the user to null if their role isn’t user', async () => {
    const fakeUser = { id: 1, firstname: 'X', lastname: 'Y', email: 'x@y' }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      .mockResolvedValueOnce({ data: { data: { users: [{ ...fakeUser, role: 'admin' }] } } })

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })

    await waitFor(() => {
      expect(screen.getByText('errors.only_users_allowed')).toBeInTheDocument()
    })
  })

  it('display user_not_found if the email lookup returns an empty array', async () => {
    const fakeUser = { id: 2, firstname: 'A', lastname: 'B', email: 'a@b' }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      .mockResolvedValueOnce({ data: { data: { users: [] } } })

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '2' } })

    await waitFor(() => {
      expect(screen.getByText('errors.user_not_found')).toBeInTheDocument()
    })
  })

  it('call logError and display user_not_found if the email lookup throws an error', async () => {
    const fakeUser = { id: 3, firstname: 'C', lastname: 'D', email: 'c@d' }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      .mockRejectedValueOnce(new Error('oops'))

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '3' } })

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith('AdminTicketCreateModalUserCheck', expect.any(Error))
      expect(screen.getByText('errors.user_not_found')).toBeInTheDocument()
    })
  })

  it('call logError and display product_not_found if the product fetch throws an error', async () => {
    axiosGetMock.mockRejectedValueOnce(new Error('bad prod'))

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '99' } })

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith('AdminTicketCreateModalProductDetails', expect.any(Error))
      expect(screen.getByText('errors.product_not_found')).toBeInTheDocument()
    })
  })

  describe('Field parsing & safeguards', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      axiosGetMock.mockResolvedValue({ data: {} })
      freeTicketMock.mockResolvedValue(true)
    })

    it('clears userId field when a non-numeric string is entered', () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
      const userInput = screen.getByTestId('freeTicket.userId') as HTMLInputElement
      fireEvent.change(userInput, { target: { value: 'abc' } })
      expect(userInput.value).toBe('')
    })

    it('clears productId field when a non-numeric string is entered', () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
      const prodInput = screen.getByTestId('freeTicket.productId') as HTMLInputElement
      fireEvent.change(prodInput, { target: { value: 'xyz' } })
      expect(prodInput.value).toBe('')
    })

    it('resets quantity to 0 when a non-numeric string is entered', () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
      const qtyInput = screen.getByTestId('freeTicket.quantity') as HTMLInputElement
      fireEvent.change(qtyInput, { target: { value: 'foo' } })
      expect(qtyInput.value).toBe('0')
    })

    it('does not call freeTicket when handleSubmit is clicked despite missing userId or productId', () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)
      fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '5' } })
      fireEvent.change(screen.getByTestId('freeTicket.quantity'), { target: { value: '2' } })

      const btn = screen.getByText('freeTicket.create') as HTMLButtonElement
      btn.removeAttribute('disabled')
      fireEvent.click(btn)

      expect(freeTicketMock).not.toHaveBeenCalled()
      expect(notifyMock).not.toHaveBeenCalled()
    })
  })

  describe('AdminTicketCreateModal – field parsing', () => {
    const onClose = vi.fn()
    const onRefresh = vi.fn()
    beforeEach(() => {
      vi.clearAllMocks()
      freeTicketMock.mockReturnValue(vi.fn().mockResolvedValue(true))
      vi.mocked(axios.get).mockResolvedValue({ data: { data: { users: [], user: {}, data: {} } } })
    })

    it('enters a non-numeric userId => value becomes "" and preview shows "noDetails"', async () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />)
      const userInput = screen.getByTestId('freeTicket.userId') as HTMLInputElement

      fireEvent.change(userInput, { target: { value: 'abc' } })
      await waitFor(() => expect(userInput.value).toBe(''))
      expect(screen.getByText(/noDetails/)).toBeInTheDocument()
    })

    it('enters a non-numeric productId => value becomes "" and preview shows "noDetails"', async () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />)
      const prodInput = screen.getByTestId('freeTicket.productId') as HTMLInputElement

      fireEvent.change(prodInput, { target: { value: 'foo' } })
      await waitFor(() => expect(prodInput.value).toBe(''))
      expect(screen.getByText(/noDetails/)).toBeInTheDocument()
    })

    it('enters a non-numeric quantity => value becomes "0" and Create button is disabled', async () => {
      render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />)
      const qtyInput = screen.getByTestId('freeTicket.quantity') as HTMLInputElement
      const createBtn = screen.getByRole('button', { name: /create/ })

      fireEvent.change(qtyInput, { target: { value: 'zzz' } })
      await waitFor(() => expect(qtyInput.value).toBe('0'))

      expect(createBtn).toBeDisabled()
    })
  })

  it('uses the token returned by useAuthStore in the axios request headers', async () => {
    const fakeUser = { id: 7, firstname: 'T', lastname: 'E', email: 't@e' }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      .mockResolvedValueOnce({ data: { data: { users: [{ ...fakeUser, role: 'user' }] } } })

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)

    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '7' } })

    await waitFor(() => {
      expect(axiosGetMock).toHaveBeenCalled()
    })

    const [[_url1, config1]] = axiosGetMock.mock.calls
    expect(config1.headers).toMatchObject({
      Authorization: 'Bearer dummy-token',      
      'Accept-Language': 'fr'
    })
  })

  it('injects the Bearer token into the headers of axios.get', async () => {
    const fakeUser = { id: 42, firstname: 'X', lastname: 'Y', email: 'x@y' }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })          
      .mockResolvedValueOnce({ data: { data: { users: [{ ...fakeUser, role: 'user' }] } } }) 

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)

    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '42' } })

    await waitFor(() => expect(axiosGetMock).toHaveBeenCalled())

    const [calledUrl, calledConfig] = axiosGetMock.mock.calls[0]

    expect(calledUrl).toBe('http://api/api/users/42')

    expect(calledConfig).toMatchObject({
      headers: {
        Authorization: 'Bearer dummy-token',
        'Accept-Language': 'fr'
      }
    })
  })

  it('disables Create when quantity > stock_quantity', async () => {
    const fakeUser = { id:1, firstname:'John', lastname:'Doe', email:'john@x', role:'user' }
    const fakeProduct = {
      id:2,
      name:'BilletTest',
      stock_quantity: 3,           
      product_details: {
        places: 3,
        date: '2025-08-01',
        time: '18:00',
        location: 'Paris',
      }
    }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })                 
      .mockResolvedValueOnce({ data: { data: { users: [fakeUser] } } })   
      .mockResolvedValueOnce({ data: { data: fakeProduct } })             

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)

    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument())

    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '2' } })
    await waitFor(() => expect(screen.getByText('BilletTest')).toBeInTheDocument())

    const qtyInput = screen.getByTestId('freeTicket.quantity') as HTMLInputElement
    fireEvent.change(qtyInput, { target: { value: '4' } })
    expect(qtyInput.value).toBe('4')

    const btn = screen.getByRole('button', { name: /freeTicket.create/i })
    expect(btn).toBeDisabled()
  })

  it('disables Create when product.stock_quantity is undefined (fallback 0) and quantity > 0', async () => {
    const fakeUser = { id:1, firstname:'John', lastname:'Doe', email:'john@x', role:'user' }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })               
      .mockResolvedValueOnce({ data: { data: { users: [fakeUser] } } }) 

    const fakeProductPartial = {
      id: 2,
      name: 'ProduitSansStock',
      product_details: {
        places: 5,
        date: '2025-08-01',
        time: '12:00',
        location: 'Paris',
      }
    }
    axiosGetMock.mockResolvedValueOnce({ data: { data: fakeProductPartial } }) 

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />)

    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument())

    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '2' } })
    await waitFor(() => expect(screen.getByText('ProduitSansStock')).toBeInTheDocument())

    const btn = screen.getByRole('button', { name: /freeTicket.create/i })
    expect(btn).toBeDisabled()
  })

  it('disables Create when user is loaded but no product is present (fallback stock 0)', async () => {
    const fakeUser = { id:1, firstname:'John', lastname:'Doe', email:'john@x', role:'user' }
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })               
      .mockResolvedValueOnce({ data: { data: { users: [fakeUser] } } }) 

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>)

    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } })
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument())

    const btn = screen.getByRole('button', { name: /freeTicket.create/i })
    expect(btn).toBeDisabled()
  })

  it('disables Create when productId is provided but fetched product is undefined (fallback stock 0)', async () => {
    const fakeUser = { id:1, firstname:'John', lastname:'Doe', email:'john@x', role:'user' };
    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })               // GET /users/1
      .mockResolvedValueOnce({ data: { data: { users: [fakeUser] } } }); // GET /users?email=...

    axiosGetMock.mockResolvedValueOnce({ data: { data: undefined } });    // GET /products/2

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>);

    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } });
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '2' } });

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /freeTicket.create/i });
      expect(btn).toBeDisabled();
    });
  });

  it('displays "noDetails" by default when neither user nor product have been entered', () => {
    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />);

    expect(screen.getByText('freeTicket.noDetails')).toBeInTheDocument();
  });

  it('refetches product when locale changes', async () => {
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
      .mockResolvedValueOnce({ data: { data: fakeProduct } })
      .mockResolvedValueOnce({ data: { data: fakeProduct } });

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />);

    fireEvent.change(screen.getByTestId('freeTicket.productId'), {
      target: { value: '2' },
    });
    await waitFor(() => {
      expect(screen.getByText('MonProduit')).toBeInTheDocument();
    });
    expect(axiosGetMock).toHaveBeenCalledTimes(1);
    const [, firstConfig] = axiosGetMock.mock.calls[0];
    expect(firstConfig.headers['Accept-Language']).toBe('fr');

    const radios = screen.getByTestId('freeTicket.locale');
    const enInput = within(radios).getByDisplayValue('en');
    fireEvent.click(enInput);

    await waitFor(() => {
      expect(axiosGetMock).toHaveBeenCalledTimes(2);
    });
    const [, secondConfig] = axiosGetMock.mock.calls[1];
    expect(secondConfig.headers['Accept-Language']).toBe('en');
  });

  it('shows the loader while the product is loading', async () => {
    const axiosGetMock = axios.get as unknown as ReturnType<typeof vi.fn>;

    axiosGetMock
      .mockResolvedValueOnce({ data: { user: { id: 1, firstname:'X', lastname:'Y', email:'x@y' } } })
      .mockResolvedValueOnce({ data: { data: { users: [{ id:1, firstname:'X', lastname:'Y', email:'x@y', role:'user' }] } } });

    axiosGetMock.mockReturnValueOnce(new Promise(() => {}));

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh} />);

    fireEvent.change(screen.getByTestId('freeTicket.userId'), { target: { value: '1' } });
    await waitFor(() => expect(screen.queryByTestId('loader')).not.toBeInTheDocument());

    fireEvent.change(screen.getByTestId('freeTicket.productId'), { target: { value: '42' } });

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('treats a non-array usersList as "user_not_found"', async () => {
    const axiosGetMock = axios.get as unknown as ReturnType<typeof vi.fn>;
    const fakeUser = { id:1, firstname:'Z', lastname:'Q', email:'z@q' };

    axiosGetMock
      .mockResolvedValueOnce({ data: { user: fakeUser } })
      .mockResolvedValueOnce({ data: { data: { users: null } } });

    render(<AdminTicketCreateModal open onClose={onClose} onRefresh={onRefresh}/>);

    fireEvent.change(screen.getByTestId('freeTicket.userId'), {
      target: { value: '1' },
    });

    await waitFor(() => {
      expect(screen.getByText('errors.user_not_found')).toBeInTheDocument();
    });
  });
})
