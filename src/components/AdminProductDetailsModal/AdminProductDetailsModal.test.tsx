import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AdminProductDetailsModal } from './AdminProductDetailsModal'

// Mock translation hook to return keys or interpolated title
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: any) => {
    // Return title with ID when appropriate
    if (key === 'products.modification' && opts?.id != null) {
      return `products.modification:${opts.id}`
    }
    return key
  }})
}))

// Mock snackbar notify
const notifyMock = vi.fn()
vi.mock('../../hooks/useCustomSnackbar', () => ({
  useCustomSnackbar: () => ({ notify: notifyMock })
}))

// Mock data hook for multi-language product details
let pdLoading = false
let pdError = false
let pdData: any = null
vi.mock('../../hooks/useProductDetailsMultiLang', () => ({
  useProductDetailsMultiLang: (_id: number|null, _langs: readonly string[]) => ({
    data: pdData,
    loading: pdLoading,
    error: pdError,
  })
}))

// Mock update hook
let updateResult = true
const updateMock = vi.fn< (id:number, body:FormData)=>Promise<boolean> >(async () => updateResult)
vi.mock('../../hooks/useUpdateProductDetails', () => ({
  useUpdateProductDetails: () => updateMock
}))

// Mock loader and error display components
vi.mock('../OlympicLoader', () => ({ default: () => <div>Loader</div> }))
vi.mock('../ErrorDisplay', () => ({ ErrorDisplay: (props:any) => <div>Error:{props.message}</div> }))

// Mock ProductForm to trigger onSubmit/onCancel
const testFile = new File(['dummy'], 'test.png', { type: 'image/png' })
const fakeTrans = {
  fr: { name:'N-FR', product_details:{ places:1,description:'D-FR',date:'2025-01-01',time:'10:00',location:'L-FR',category:'C-FR',image:'',imageFile:undefined } },
  en: { name:'N-EN', product_details:{ places:2,description:'D-EN',date:'2025-02-02',time:'11:00',location:'L-EN',category:'C-EN',image:'',imageFile:undefined } },
  de: { name:'N-DE', product_details:{ places:3,description:'D-DE',date:'2025-03-03',time:'12:00',location:'L-DE',category:'C-DE',image:'',imageFile:undefined } }
}
vi.mock('../ProductForm', () => ({
  ProductForm: (props:any) => (
    <div>
      {/* Trigger submit without image */}
      <button onClick={() => props.onSubmit({ 
        price: 42, sale: 0.2, stock_quantity: 7, imageFile: undefined,
        translations: fakeTrans
      })}>Submit</button>
      {/* Trigger submit with image */}
      <button onClick={() => props.onSubmit({ 
        price: 42, sale: 0.2, stock_quantity: 7, imageFile: testFile,
        translations: fakeTrans
      })}>SubmitWithImage</button>
      {/* Trigger cancel */}
      <button onClick={props.onCancel}>Cancel</button>
    </div>
  )
}))

describe('<AdminProductDetailsModal />', () => {
  const onClose = vi.fn()
  const onRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    pdLoading = false
    pdError = false
    pdData = null
    updateResult = true
  })

  it('renders nothing when open=false', () => {
    render(<AdminProductDetailsModal open={false} productId={123} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    expect(screen.queryByText('products.modification:123')).toBeNull()
  })

  it('shows loader while data is loading', () => {
    pdLoading = true
    render(<AdminProductDetailsModal open={true} productId={5} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    expect(screen.getByText('Loader')).toBeInTheDocument()
  })

  it('shows error display when fetch fails', () => {
    pdError = true
    render(<AdminProductDetailsModal open={true} productId={77} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    expect(screen.getByText('Error:errors.not_found')).toBeInTheDocument()
  })

  it('renders form when data is available', () => {
    pdData = {
      fr: { ...fakeTrans.fr, price: 1, sale: 0, stock_quantity: 1 },
      en: { ...fakeTrans.en, price: 2, sale: 0.1, stock_quantity: 2 },
      de: { ...fakeTrans.de, price: 3, sale: 0.2, stock_quantity: 3 }
    }
    render(<AdminProductDetailsModal open={true} productId={9} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    // Title includes interpolated ID
    expect(screen.getByText('products.modification:9')).toBeInTheDocument()
    // Form buttons from our mock
    expect(screen.getByText('Submit')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', () => {
    pdData = { fr:{...fakeTrans.fr, price:0,sale:0,stock_quantity:0}, en:{...fakeTrans.en, price:0,sale:0,stock_quantity:0}, de:{...fakeTrans.de, price:0,sale:0,stock_quantity:0} }
    render(<AdminProductDetailsModal open={true} productId={55} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('on successful submit: notifies success and refreshes', async () => {
    pdData = { fr:{...fakeTrans.fr, price:0,sale:0,stock_quantity:0}, en:{...fakeTrans.en, price:0,sale:0,stock_quantity:0}, de:{...fakeTrans.de, price:0,sale:0,stock_quantity:0} }
    render(<AdminProductDetailsModal open={true} productId={42} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    await userEvent.click(screen.getByText('Submit'))

    // Verify updateProduct call
    expect(updateMock).toHaveBeenCalledOnce()
    // Expect success notification and refresh
    expect(notifyMock).toHaveBeenCalledWith('products.success', 'success')
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('appends image file when provided', async () => {
    pdData = { fr:{...fakeTrans.fr, price:0,sale:0,stock_quantity:0}, en:{...fakeTrans.en, price:0,sale:0,stock_quantity:0}, de:{...fakeTrans.de, price:0,sale:0,stock_quantity:0} }
    render(<AdminProductDetailsModal open={true} productId={88} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    await userEvent.click(screen.getByText('SubmitWithImage'))

    // Extract FormData from update call args
    const formData = updateMock.mock.calls[0][1] as FormData
    const file = formData.get('image')
    expect(file).toBeInstanceOf(File)
    expect((file as File).name).toBe('test.png')
  })

  it('shows error notification on failed submit', async () => {
    pdData = { fr:{...fakeTrans.fr, price:0,sale:0,stock_quantity:0}, en:{...fakeTrans.en, price:0,sale:0,stock_quantity:0}, de:{...fakeTrans.de, price:0,sale:0,stock_quantity:0} }
    updateResult = false
    render(<AdminProductDetailsModal open={true} productId={7} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    await userEvent.click(screen.getByText('Submit'))

    expect(updateMock).toHaveBeenCalledOnce()
    expect(notifyMock).toHaveBeenCalledWith('errors.save_failed', 'error')
    expect(onRefresh).not.toHaveBeenCalled()
  })
})
