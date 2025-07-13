import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AdminProductDuplicationModal } from './AdminProductDuplicationModal'

// 1) mock useTranslation
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

// 2) mock useCustomSnackbar
const notifyMock = vi.fn()
vi.mock('../../hooks/useCustomSnackbar', () => ({
  useCustomSnackbar: () => ({ notify: notifyMock })
}))

// 3) mock useProductDetailsMultiLang
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

// 4) mock useCreateProduct
let createResult = true
const createMock = vi.fn< (body:FormData) => Promise<boolean> >(async () => createResult)
vi.mock('../../hooks/useCreateProduct', () => ({
  useCreateProduct: () => createMock
}))

// 5) mock OlympicLoader & ErrorDisplay
vi.mock('../OlympicLoader', () => ({ default: () => <div>Loader</div> }))
vi.mock('../ErrorDisplay', () => ({ ErrorDisplay: (p:any) => <div>Error:{p.message}</div> }))

// 6) mock ProductForm
const testFile = new File(['x'], 'dup.png', { type: 'image/png' })
const fakeTrans = {
  fr: { name: 'N-FR', product_details: { places:1,description:'D-FR',date:'2025-01-01',time:'10:00',location:'L-FR',category:'C-FR',image:'',imageFile:undefined } },
  en: { name: 'N-EN', product_details: { places:2,description:'D-EN',date:'2025-02-02',time:'11:00',location:'L-EN',category:'C-EN',image:'',imageFile:undefined } },
  de: { name: 'N-DE', product_details: { places:3,description:'D-DE',date:'2025-03-03',time:'12:00',location:'L-DE',category:'C-DE',image:'',imageFile:undefined } },
}
vi.mock('../ProductForm', () => ({
  ProductForm: (props:any) => (
    <div>
      <button onClick={() => props.onSubmit({
        price: 99, sale: 0.15, stock_quantity: 4, imageFile: undefined,
        translations: fakeTrans
      })}>SubmitNoImage</button>
      <button onClick={() => props.onSubmit({
        price: 99, sale: 0.15, stock_quantity: 4, imageFile: testFile,
        translations: fakeTrans
      })}>SubmitWithImage</button>
      <button onClick={props.onCancel}>Cancel</button>
    </div>
  )
}))

describe('<AdminProductDuplicationModal />', () => {
  const onClose = vi.fn()
  const onRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    pdLoading = false
    pdError   = false
    pdData    = null
    createResult = true
  })

  it('ne rend rien si open=false', () => {
    render(<AdminProductDuplicationModal open={false} productId={42} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    expect(screen.queryByText('products.duplication:42')).toBeNull()
  })

  it('rend loader si loading', () => {
    pdLoading = true
    render(<AdminProductDuplicationModal open={true} productId={7} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    expect(screen.getByText('Loader')).toBeInTheDocument()
  })

  it('rend error si error', () => {
    pdError = true
    render(<AdminProductDuplicationModal open={true} productId={8} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    expect(screen.getByText('Error:errors.not_found')).toBeInTheDocument()
  })

  it('affiche le form quand data est là', () => {
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

  it('ferme la modal sur Cancel', () => {
    pdData = { fr:{...fakeTrans.fr, price:0,sale:0,stock_quantity:0}, en:{...fakeTrans.en, price:0,sale:0,stock_quantity:0}, de:{...fakeTrans.de, price:0,sale:0,stock_quantity:0} }
    render(<AdminProductDuplicationModal open={true} productId={5} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('submission success : notifie & rafraîchit', async () => {
    pdData = { fr:{...fakeTrans.fr, price:0,sale:0,stock_quantity:0}, en:{...fakeTrans.en, price:0,sale:0,stock_quantity:0}, de:{...fakeTrans.de, price:0,sale:0,stock_quantity:0} }
    render(<AdminProductDuplicationModal open={true} productId={11} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    await userEvent.click(screen.getByText('SubmitNoImage'))

    expect(createMock).toHaveBeenCalledOnce()
    expect(notifyMock).toHaveBeenCalledWith('products.success', 'success')
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('branche image : body.append("image",...)', async () => {
    pdData = { fr:{...fakeTrans.fr, price:0,sale:0,stock_quantity:0}, en:{...fakeTrans.en, price:0,sale:0,stock_quantity:0}, de:{...fakeTrans.de, price:0,sale:0,stock_quantity:0} }
    render(<AdminProductDuplicationModal open={true} productId={12} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    await userEvent.click(screen.getByText('SubmitWithImage'))

    const formData = createMock.mock.calls[0][0] as FormData
    const file = formData.get('image')
    expect(file).toBeInstanceOf(File)
    expect((file as File).name).toBe('dup.png')
  })

  it('submission fail : notifie erreur', async () => {
    pdData = { fr:{...fakeTrans.fr, price:0,sale:0,stock_quantity:0}, en:{...fakeTrans.en, price:0,sale:0,stock_quantity:0}, de:{...fakeTrans.de, price:0,sale:0,stock_quantity:0} }
    createResult = false
    render(<AdminProductDuplicationModal open={true} productId={13} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    await userEvent.click(screen.getByText('SubmitNoImage'))

    expect(createMock).toHaveBeenCalledOnce()
    expect(notifyMock).toHaveBeenCalledWith('errors.save_failed', 'error')
    expect(onRefresh).not.toHaveBeenCalled()
  })
})
