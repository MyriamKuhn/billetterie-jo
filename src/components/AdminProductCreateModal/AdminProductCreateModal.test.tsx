import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AdminProductCreateModal } from './AdminProductCreateModal'

// 1) mock useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

// 2) mock useCustomSnackbar
const notifyMock = vi.fn()
vi.mock('../../hooks/useCustomSnackbar', () => ({
  useCustomSnackbar: () => ({ notify: notifyMock })
}))

// 3) mock useCreateProduct
let createProductResult = true
const createProductMock = vi.fn<(data: FormData) => Promise<boolean>>(async () => createProductResult)
vi.mock('../../hooks/useCreateProduct', () => ({
  useCreateProduct: () => createProductMock
}))

vi.mock('../ProductForm', () => {
  const testFile = new File(['dummy'], 'test.png', { type: 'image/png' });
  // Valeurs factices complètes
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
        {/* Submit sans image */}
        <button onClick={() => props.onSubmit({
          price: 10,
          sale: 0.1,
          stock_quantity: 5,
          imageFile: undefined,
          translations: fakeTranslations
        })}>
          Submit
        </button>

        {/* Submit avec image */}
        <button onClick={() => props.onSubmit({
          price: 10,
          sale: 0.1,
          stock_quantity: 5,
          imageFile: testFile,
          translations: fakeTranslations
        })}>
          SubmitWithImage
        </button>

        {/* Cancel */}
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

  it('n’affiche rien si open=false', () => {
    render(<AdminProductCreateModal open={false} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    expect(screen.queryByText('products.create_new')).toBeNull()
  })

  it('affiche le titre et ProductForm si open=true', () => {
    render(<AdminProductCreateModal open={true} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    expect(screen.getByText('products.create_new')).toBeInTheDocument()
    // notre mock ProductForm affiche un bouton Submit
    expect(screen.getByText('Submit')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('ferme la modal quand onCancel est appelé', () => {
    render(<AdminProductCreateModal open={true} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('sur succès de createProduct : notifie success et appelle onRefresh', async () => {
    createProductResult = true
    render(<AdminProductCreateModal open={true} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    await userEvent.click(screen.getByText('Submit'))

    // createProduct a reçu un FormData avec tous les champs
    expect(createProductMock).toHaveBeenCalledOnce()
    // notification de succès
    expect(notifyMock).toHaveBeenCalledWith('products.success', 'success')
    // rafraîchissement
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('sur échec de createProduct : notifie error et ne rafraîchit pas', async () => {
    createProductResult = false
    render(<AdminProductCreateModal open={true} onClose={onClose} onRefresh={onRefresh} lang="en" />)
    await userEvent.click(screen.getByText('Submit'))

    expect(createProductMock).toHaveBeenCalledOnce()
    expect(notifyMock).toHaveBeenCalledWith('errors.save_failed', 'error')
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('appelle body.append("image", ...) quand data.imageFile est présent', async () => {
    // on rend la modal ouverte
    render(
      <AdminProductCreateModal
        open={true}
        onClose={onClose}
        onRefresh={onRefresh}
        lang="en"
      />
    );

    // clique sur le bouton SubmitWithImage
    await userEvent.click(screen.getByText('SubmitWithImage'));

    // on récupère le premier argument du premier appel
    // grâce au typage explicite du mock (voir plus bas)
    const formData = createProductMock.mock.calls[0][0] as FormData;

    // on vérifie que la clé "image" existe bien et contient notre File
    const file = formData.get('image');
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe('test.png');
  });
})
