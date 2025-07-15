import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AdminProductDuplicationModal } from './AdminProductDuplicationModal'

// 1) mock useTranslation: returns the key or interpolated duplication title
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      if (key === 'products.duplication' && opts?.id != null) {
        return `products.duplication:${opts.id}`
      }
      return key
    }
  })
}))

// 2) mock snackbar hook to capture notifications
const notifyMock = vi.fn()
vi.mock('../../hooks/useCustomSnackbar', () => ({
  useCustomSnackbar: () => ({ notify: notifyMock })
}))

// 3) mock data fetching hook: controls loading, error, and data states
let pdLoading = false
let pdError = false
let pdData: any = null
vi.mock('../../hooks/useProductDetailsMultiLang', () => ({
  useProductDetailsMultiLang: (_id: number | null, _langs: readonly string[]) => ({
    data: pdData,
    loading: pdLoading,
    error: pdError,
  })
}))

// 4) mock createProduct hook: resolves based on createResult
let createResult = true
const createMock = vi.fn< (body:FormData) => Promise<boolean> >(async () => createResult)
vi.mock('../../hooks/useCreateProduct', () => ({
  useCreateProduct: () => createMock
}))

// 5) mock loader and error display components for visual states
vi.mock('../OlympicLoader', () => ({ default: () => <div>Loader</div> }))
vi.mock('../ErrorDisplay', () => ({ ErrorDisplay: (p:any) => <div>Error:{p.message}</div> }))

// 6) mock ProductForm to emit onSubmit and onCancel events
const testFile = new File(['x'], 'dup.png', { type: 'image/png' })
const fakeTrans = {
  fr: { name: 'N-FR', product_details: { places:1,description:'D-FR',date:'2025-01-01',time:'10:00',location:'L-FR',category:'C-FR',image:'',imageFile:undefined } },
  en: { name: 'N-EN', product_details: { places:2,description:'D-EN',date:'2025-02-02',time:'11:00',location:'L-EN',category:'C-EN',image:'',imageFile:undefined } },
  de: { name: 'N-DE', product_details: { places:3,description:'D-DE',date:'2025-03-03',time:'12:00',location:'L-DE',category:'C-DE',image:'',imageFile:undefined } },
}
vi.mock('../ProductForm', () => ({
  ProductForm: (props:any) => (
    <div>
      {/* Submit with no image file */}
      <button onClick={() => props.onSubmit({
        price: 99, sale: 0.15, stock_quantity: 4, imageFile: undefined,
        translations: fakeTrans
      })}>SubmitNoImage</button>
      {/* Submit with an image file */}
      <button onClick={() => props.onSubmit({
        price: 99, sale: 0.15, stock_quantity: 4, imageFile: testFile,
        translations: fakeTrans
      })}>SubmitWithImage</button>
      {/* Cancel action */}
      <button onClick={props.onCancel}>Cancel</button>
    </div>
  )
}))

describe('<AdminProductDuplicationModal />', () => {
  const onClose = vi.fn()
  const onRefresh = vi.fn()

  // Reset mocks and state before each test
  beforeEach(() => {
    vi.clearAllMocks()
    pdLoading = false
    pdError   = false
    pdData    = null
    createResult = true
  })

  it('renders nothing when open=false', () => {
    render(<AdminProductDuplicationModal open={false} productId={42} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    expect(screen.queryByText('products.duplication:42')).toBeNull()
  })

  it('shows loader when fetching data', () => {
    pdLoading = true
    render(<AdminProductDuplicationModal open={true} productId={7} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    expect(screen.getByText('Loader')).toBeInTheDocument()
  })

  it('displays error when fetch fails', () => {
    pdError = true
    render(<AdminProductDuplicationModal open={true} productId={8} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    expect(screen.getByText('Error:errors.not_found')).toBeInTheDocument()
  })

  it('renders form when data is available', () => {
    pdData = {
      fr: { ...fakeTrans.fr, price: 1, sale:0, stock_quantity:1 },
      en: { ...fakeTrans.en, price: 2, sale:0.1, stock_quantity:2 },
      de: { ...fakeTrans.de, price: 3, sale:0.2, stock_quantity:3 }
    }
    render(<AdminProductDuplicationModal open={true} productId={99} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    expect(screen.getByText('products.duplication:99')).toBeInTheDocument()
    expect(screen.getByText('SubmitNoImage')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('calls onClose on cancel click', () => {
    pdData = { fr:{...fakeTrans.fr, price:0,sale:0,stock_quantity:0}, en:{...fakeTrans.en, price:0,sale:0,stock_quantity:0}, de:{...fakeTrans.de, price:0,sale:0,stock_quantity:0} }
    render(<AdminProductDuplicationModal open={true} productId={5} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('on successful submit: notifies success and refreshes', async () => {
    pdData = { fr:{...fakeTrans.fr, price:0,sale:0,stock_quantity:0}, en:{...fakeTrans.en, price:0,sale:0,stock_quantity:0}, de:{...fakeTrans.de, price:0,sale:0,stock_quantity:0} }
    render(<AdminProductDuplicationModal open={true} productId={11} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    await userEvent.click(screen.getByText('SubmitNoImage'))

    // Verify createMock was called
    expect(createMock).toHaveBeenCalledOnce()
    // Expect success notification and refresh
    expect(notifyMock).toHaveBeenCalledWith('products.success', 'success')
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('appends image when provided', async () => {
    pdData = { fr:{...fakeTrans.fr, price:0,sale:0,stock_quantity:0}, en:{...fakeTrans.en, price:0,sale:0,stock_quantity:0}, de:{...fakeTrans.de, price:0,sale:0,stock_quantity:0} }
    render(<AdminProductDuplicationModal open={true} productId={12} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    await userEvent.click(screen.getByText('SubmitWithImage'))

    // Extract the FormData passed to creation hook
    const formData = createMock.mock.calls[0][0] as FormData
    const file = formData.get('image')
    expect(file).toBeInstanceOf(File)
    expect((file as File).name).toBe('dup.png')
  })

  it('on failed submit: notifies error and does not refresh', async () => {
    pdData = { fr:{...fakeTrans.fr, price:0,sale:0,stock_quantity:0}, en:{...fakeTrans.en, price:0,sale:0,stock_quantity:0}, de:{...fakeTrans.de, price:0,sale:0,stock_quantity:0} }
    createResult = false
    render(<AdminProductDuplicationModal open={true} productId={13} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    await userEvent.click(screen.getByText('SubmitNoImage'))

    expect(createMock).toHaveBeenCalledOnce()
    expect(notifyMock).toHaveBeenCalledWith('errors.save_failed', 'error')
    expect(onRefresh).not.toHaveBeenCalled()
  })
})
