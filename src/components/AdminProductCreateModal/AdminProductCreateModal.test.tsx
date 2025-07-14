import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AdminProductCreateModal } from './AdminProductCreateModal'

// Mock translation hook to return keys directly
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

// Mock snackbar notify
const notifyMock = vi.fn()
vi.mock('../../hooks/useCustomSnackbar', () => ({
  useCustomSnackbar: () => ({ notify: notifyMock })
}))

// Mock createProduct hook with controllable resolved value
let createProductResult = true
const createProductMock = vi.fn<(data: FormData) => Promise<boolean>>(async () => createProductResult)
vi.mock('../../hooks/useCreateProduct', () => ({
  useCreateProduct: () => createProductMock
}))

// Mock ProductForm to emit onSubmit/onCancel calls with fake data
vi.mock('../ProductForm', () => {
  const testFile = new File(['dummy'], 'test.png', { type: 'image/png' });
  const fakeTranslations = {
    fr: {
      name: 'NomFR',
      product_details: {
        places: 1, description: 'DescFR',
        date: '2025-01-01', time: '12:00',
        location: 'LocFR', category: 'CatFR',
        image: '', imageFile: undefined
      }
    },
    en: {
      name: 'NameEN',
      product_details: {
        places: 2, description: 'DescEN',
        date: '2025-02-02', time: '13:00',
        location: 'LocEN', category: 'CatEN',
        image: '', imageFile: undefined
      }
    },
    de: {
      name: 'NameDE',
      product_details: {
        places: 3, description: 'DescDE',
        date: '2025-03-03', time: '14:00',
        location: 'LocDE', category: 'CatDE',
        image: '', imageFile: undefined
      }
    },
  };

  return {
    ProductForm: (props: any) => (
      <div>
        {/* Trigger submit without an image */}
        <button onClick={() => props.onSubmit({
          price: 10,
          sale: 0.1,
          stock_quantity: 5,
          imageFile: undefined,
          translations: fakeTranslations
        })}>
          Submit
        </button>

        {/* Trigger submit including an image file */}
        <button onClick={() => props.onSubmit({
          price: 10,
          sale: 0.1,
          stock_quantity: 5,
          imageFile: testFile,
          translations: fakeTranslations
        })}>
          SubmitWithImage
        </button>

        {/* Trigger cancel */}
        <button onClick={props.onCancel}>Cancel</button>
      </div>
    )
  };
});

describe('<AdminProductCreateModal/>', () => {
  const onClose = vi.fn()
  const onRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when open=false', () => {
    render(<AdminProductCreateModal open={false} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    expect(screen.queryByText('products.create_new')).toBeNull()
  })

  it('shows title and form when open=true', () => {
    render(<AdminProductCreateModal open={true} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    // Title key should be displayed
    expect(screen.getByText('products.create_new')).toBeInTheDocument()
    // Our mock ProductForm renders these buttons
    expect(screen.getByText('Submit')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', () => {
    render(<AdminProductCreateModal open={true} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('on successful create: notifies success and refreshes', async () => {
    createProductResult = true
    render(<AdminProductCreateModal open={true} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    await userEvent.click(screen.getByText('Submit'))

    // createProduct should be called once with a FormData instance
    expect(createProductMock).toHaveBeenCalledOnce()
    // Expect success notification
    expect(notifyMock).toHaveBeenCalledWith('products.success', 'success')
    // Expect list refresh
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('on failure: notifies error and does not refresh', async () => {
    createProductResult = false
    render(<AdminProductCreateModal open={true} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    await userEvent.click(screen.getByText('Submit'))

    expect(createProductMock).toHaveBeenCalledOnce()
    expect(notifyMock).toHaveBeenCalledWith('errors.save_failed', 'error')
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('appends image file to FormData when provided', async () => {
    render(
      <AdminProductCreateModal
        open={true}
        onClose={onClose}
        onRefresh={onRefresh}
        lang="en"
      />
    );

    await userEvent.click(screen.getByText('SubmitWithImage'));

    // Extract FormData passed to createProduct
    const formData = createProductMock.mock.calls[0][0] as FormData;

    const file = formData.get('image');
    // Ensure the file is correctly appended
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe('test.png');
  });
})
