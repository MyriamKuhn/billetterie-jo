import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { ProductForm } from './ProductForm'
import { beforeAll, beforeEach, describe, it, vi, expect } from 'vitest'
import { API_BASE_URL } from '../../config'
import type { ProductFormData } from '../../types/admin'

// ──────── 1) MOCKS GLOBAUX ────────────────────────────────────────────────────
// Mock du hook i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

// Mock de FlagIcon (rend juste du texte)
vi.mock('../FlagIcon', () => ({
  default: (props: any) => <span>Flag:{props.code}</span>
}))

// Mock de DatePicker (input date native)
vi.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: (props: any) => (
    <input
      data-testid="date-picker"
      type="date"
      value={props.value ? props.value.format('YYYY-MM-DD') : ''}
      onChange={e =>
        props.onChange(e.target.value ? dayjs(e.target.value) : null)
      }
    />
  )
}))

// Stub par défaut de createObjectURL
beforeAll(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
})

// Fonction utilitaire pour rendre le form
function renderForm(
  initialValues: ProductFormData,
  saving = false,
  onSubmit = vi.fn(async () => true),
  onCancel = vi.fn()
) {
  return render(
    <ProductForm
      initialValues={initialValues}
      saving={saving}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  )
}

// Jeux de valeurs de base
const baseInit: ProductFormData = {
  price: 10,
  sale: 0.2,
  stock_quantity: 5,
  imageFile: undefined,
  translations: {
    fr: {
      name: 'NomFR',
      product_details: {
        places: 2,
        description: 'DescFR',
        date: '2025-01-01',
        time: '08:00',
        location: 'LocFR',
        category: 'CatFR',
        image: 'img-fr.png',
        imageFile: undefined
      }
    },
    en: {
      name: 'NameEN',
      product_details: {
        places: 3,
        description: 'DescEN',
        date: '2025-02-02',
        time: '09:00',
        location: 'LocEN',
        category: 'CatEN',
        image: 'img-en.png',
        imageFile: undefined
      }
    },
    de: {
      name: 'NameDE',
      product_details: {
        places: 4,
        description: 'DescDE',
        date: '2025-03-03',
        time: '10:00',
        location: 'LocDE',
        category: 'CatDE',
        image: 'img-de.png',
        imageFile: undefined
      }
    }
  }
}

// Stub de ImageDropzone : bouton DropFile + bouton ClearFile + preview text
vi.mock('../ImageDropzone', () => {
  const testFile = new File(['x'], 'img.png', { type: 'image/png' })
  return {
    ImageDropzone: (props: any) => (
      <div>
        <button onClick={() => props.onFileSelected(testFile)}>
          DropFile
        </button>
        <button onClick={() => props.onFileSelected(undefined)}>
          ClearFile
        </button>
        <div data-testid="preview">
          {props.previewUrl ?? 'no-preview'}
        </div>
      </div>
    )
  }
})

// ──────── TESTS ──────────────────────────────────────────────────────────────
describe('<ProductForm />', () => {
  it('affiche bien tous les champs initiaux', () => {
    renderForm(baseInit)

    // Champs globaux
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('20')).toBeInTheDocument() // sale * 100
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()

    // PreviewURL distant EN par défaut
    expect(screen.getByTestId('preview').textContent).toBe(
      `${API_BASE_URL}/products/images/img-en.png`
    )

    // Onglet FR actif
    expect(screen.getByText('Flag:FR')).toBeInTheDocument()
    expect(screen.getByDisplayValue('NomFR')).toBeInTheDocument()
  })

  it('édite les champs globaux', async () => {
    renderForm(baseInit)
    await userEvent.clear(screen.getByLabelText('products.price'))
    await userEvent.type(screen.getByLabelText('products.price'), '15')
    expect(screen.getByDisplayValue('15')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('products.sale'))
    await userEvent.type(screen.getByLabelText('products.sale'), '50')
    expect(screen.getByDisplayValue('50')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('products.stock'))
    await userEvent.type(screen.getByLabelText('products.stock'), '8')
    expect(screen.getByDisplayValue('8')).toBeInTheDocument()
  })

  it('dropFile → utilise createObjectURL et met à jour le preview', async () => {
    renderForm(baseInit)
    await userEvent.click(screen.getByText('DropFile'))
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(screen.getByTestId('preview').textContent).toBe('blob:mock-url')
  })

  it('clearFile → previewUrl undefined passe au fallback distant', async () => {
    renderForm(baseInit)
    // d’abord on drop pour injecter imageFile
    await userEvent.click(screen.getByText('DropFile'))
    expect(screen.getByTestId('preview').textContent).toBe('blob:mock-url')

    // puis on clear
    await userEvent.click(screen.getByText('ClearFile'))
    expect(screen.getByTestId('preview').textContent).toBe(
      `${API_BASE_URL}/products/images/img-en.png`
    )
  })

  it('change de langue et édite les champs traduits', async () => {
    renderForm(baseInit)
    const tabs = screen.getAllByRole('tab')
    await userEvent.click(tabs[1]) // EN
    expect(screen.getByText('Flag:US')).toBeInTheDocument()

    const nameEn = screen.getByLabelText('products.name')
    await userEvent.clear(nameEn)
    await userEvent.type(nameEn, 'NewNameEN')
    expect(screen.getByDisplayValue('NewNameEN')).toBeInTheDocument()
  })

  it('DatePicker change → met à jour avec une vraie date', () => {
    renderForm(baseInit)
    const dateInput = screen.getByTestId('date-picker') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2026-12-31' } })
    expect(screen.getByDisplayValue('2026-12-31')).toBeInTheDocument()
  })

  it('DatePicker clear (null) → isoVide ""', async () => {
    let submitted: ProductFormData | null = null
    const onSubmit = vi.fn(async data => {
      submitted = data
      return false
    })
    renderForm(baseInit, false, onSubmit)

    const dateInput = screen.getByTestId('date-picker') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '' } })

    const [saveBtn] = screen.getAllByRole('button', { name: 'products.save' })
    await userEvent.click(saveBtn)

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(submitted!.translations.fr.product_details.date).toBe('')
  })

  it('sale vide puis abc → retombe à 0%', async () => {
    renderForm(baseInit)
    const saleInput = screen.getByLabelText('products.sale')
    await userEvent.clear(saleInput)
    await userEvent.type(saleInput, 'abc')
    expect(screen.getByDisplayValue('0')).toBeInTheDocument()
  })

  it('save true → onCancel appelé, save false → onCancel non appelé', async () => {
    // cas succès
    const onCancel1 = vi.fn()
    const onSubmit1 = vi.fn(async () => true)
    renderForm(baseInit, false, onSubmit1, onCancel1)
    const [saveBtn1] = screen.getAllByRole('button', { name: 'products.save' })
    await userEvent.click(saveBtn1)
    expect(onCancel1).toHaveBeenCalled()

    // cas échec
    const onCancel2 = vi.fn()
    const onSubmit2 = vi.fn(async () => false)
    renderForm(baseInit, false, onSubmit2, onCancel2)
    const [saveBtn2] = screen.getAllByRole('button', { name: 'products.save' })
    await userEvent.click(saveBtn2)
    expect(onCancel2).not.toHaveBeenCalled()
  })
})

describe('<ProductForm /> — branches restantes', () => {
  // Remet le stub createObjectURL sur chaque test
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  })

  // spies partagées
  const onSubmitSpy = vi.fn(async () => true)
  const onCancelSpy = vi.fn()

  it('previewUrl distant si pas de imageFile mais nom de fichier remote', () => {
    const customInit: ProductFormData = {
      ...baseInit,
      translations: {
        ...baseInit.translations,
        en: {
          ...baseInit.translations.en,
          product_details: {
            ...baseInit.translations.en.product_details,
            image: 'remote.png'
          }
        }
      }
    }
    renderForm(customInit, false, onSubmitSpy, onCancelSpy)
    expect(screen.getByTestId('preview').textContent).toBe(
      `${API_BASE_URL}/products/images/remote.png`
    )
  })

  it('no-preview si ni imageFile ni remote image', () => {
    const customInit2: ProductFormData = {
      ...baseInit,
      translations: {
        fr: {
          ...baseInit.translations.fr,
          product_details: {
            ...baseInit.translations.fr.product_details,
            image: ''
          }
        },
        en: {
          ...baseInit.translations.en,
          product_details: {
            ...baseInit.translations.en.product_details,
            image: ''
          }
        },
        de: {
          ...baseInit.translations.de,
          product_details: {
            ...baseInit.translations.de.product_details,
            image: ''
          }
        }
      }
    }
    renderForm(customInit2, false, onSubmitSpy, onCancelSpy)
    expect(screen.getByTestId('preview').textContent).toBe('no-preview')
  })

  it('réinitialise formData et tabIndex quand initialValues change', () => {
    const modified: ProductFormData = {
      ...baseInit,
      translations: {
        ...baseInit.translations,
        fr: {
          ...baseInit.translations.fr,
          name: 'ResetFR'
        }
      }
    }
    renderForm(modified, false, onSubmitSpy, onCancelSpy)

    // le champ name doit refléter « ResetFR »
    const nameInput = screen.getByLabelText('products.name') as HTMLInputElement
    expect(nameInput.value).toBe('ResetFR')

    // et on revient bien sur l’onglet FR
    expect(screen.getByText('Flag:FR')).toBeInTheDocument()
  })
})
