import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { ProductForm } from './ProductForm'
import { beforeAll, vi } from 'vitest'
import { API_BASE_URL } from '../../config'
import type { ProductFormData } from '../../types/admin'

// 1) mock useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

// 2) mock ImageDropzone pour injecter un bouton qui appelle onFileSelected
const testFile = new File(['x'], 'img.png', { type: 'image/png' })
vi.mock('../ImageDropzone', () => ({
  ImageDropzone: (props: any) => (
    <div>
      <button onClick={() => props.onFileSelected(testFile)}>DropFile</button>
      {/* PreviewUrl affiché sous forme de texte pour test */}
      <div data-testid="preview">{props.previewUrl ?? 'no-preview'}</div>
    </div>
  )
}))

// 3) mock FlagIcon pour ne pas charger de SVG
vi.mock('../FlagIcon', () => ({
  default: (props: any) => <span>Flag:{props.code}</span>
}))

// 4) mock DatePicker pour afficher un input que l'on peut changer
vi.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: (props: any) => (
    <input
      data-testid="date-picker"
      type="date"
      value={props.value ? props.value.format('YYYY-MM-DD') : ''}
      onChange={e => props.onChange(e.target.value ? dayjs(e.target.value) : null)}
    />
  )
}))

beforeAll(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
})

function renderForm(
  initialValues: ProductFormData,
  saving: boolean,
  onSubmit: (data: ProductFormData) => Promise<boolean>,
  onCancel: () => void
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

describe('<ProductForm/>', () => {
  const onCancel = vi.fn()
  let onSubmit: ReturnType<typeof vi.fn>
  let submitResult = true

  const initialValues = {
    price: 10,
    sale: 0.2,
    stock_quantity: 5,
    imageFile: undefined as File | undefined,
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
          imageFile: undefined as File | undefined
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
          imageFile: undefined as File | undefined
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
          imageFile: undefined as File | undefined
        }
      }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    onSubmit = vi.fn(async data => {
      expect(data.price).toBeTypeOf('number')
      return submitResult
    })
  })

  it('render all fields with initialValues', () => {
    renderForm(initialValues, false, onSubmit, onCancel)

    // Globaux
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('20')).toBeInTheDocument() // sale * 100
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()

    // Preview fallback to translations.en.image
    expect(screen.getByTestId('preview').textContent).toContain('img-en.png')

    // Onglets & FR
    expect(screen.getByText('Flag:FR')).toBeInTheDocument()
    expect(screen.getByDisplayValue('NomFR')).toBeInTheDocument()
  })

  it('éditer champs globaux met à jour formData', async () => {
    renderForm(initialValues, false, onSubmit, onCancel)

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

  it('drop image met à jour imageFile et previewUrl', async () => {
    renderForm(initialValues, false, onSubmit, onCancel)
    await userEvent.click(screen.getByText('DropFile'))

    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(screen.getByTestId('preview').textContent).toContain('blob:mock-url')
  })

  it('change de langue via onglet et édite champs', async () => {
    renderForm(initialValues, false, onSubmit, onCancel)
    await userEvent.click(screen.getAllByRole('tab')[1])
    expect(screen.getByText('Flag:US')).toBeInTheDocument()

    const nameEn = screen.getByDisplayValue('NameEN')
    await userEvent.clear(nameEn)
    await userEvent.type(nameEn, 'NewEN')
    expect(screen.getByDisplayValue('NewEN')).toBeInTheDocument()
  })

  it('change date via DatePicker met à jour formData', async () => {
    renderForm(initialValues, false, onSubmit, onCancel)
    // date picker pour FR
    const dateInput = screen.getByTestId('date-picker') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2026-12-31' } })
    expect(screen.getByDisplayValue('2026-12-31')).toBeInTheDocument()
  })

  it('click close appelle onCancel', async () => {
    renderForm(initialValues, false, onSubmit, onCancel)
    await userEvent.click(screen.getByRole('button', { name: 'products.close' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('soumission réussie appelle onCancel', async () => {
    submitResult = true
    renderForm(initialValues, false, onSubmit, onCancel)
    await userEvent.click(screen.getByRole('button', { name: 'products.save' }))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('soumission échouée ne appelle pas onCancel', async () => {
    submitResult = false
    renderForm(initialValues, false, onSubmit, onCancel)
    await userEvent.click(screen.getByRole('button', { name: 'products.save' }))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('updates nested translation fields: description, places, time, location, category', async () => {
    renderForm(initialValues, false, onSubmit, onCancel)

    // Par défaut on est sur FR (tabIndex=0)
    // 1) Description
    const descInput = screen.getByLabelText('products.description')
    await userEvent.clear(descInput)
    await userEvent.type(descInput, 'NewDescFR')
    expect(descInput).toHaveValue('NewDescFR')

    // 2) Places
    const placeInput = screen.getByLabelText('products.place')
    await userEvent.clear(placeInput)
    await userEvent.type(placeInput, '7')
    expect(placeInput).toHaveValue(7)

    // 3) Time
    const timeInput = screen.getByLabelText('products.time')
    await userEvent.clear(timeInput)
    await userEvent.type(timeInput, '14:30')
    expect(timeInput).toHaveValue('14:30')

    // 4) Location
    const locInput = screen.getByLabelText('products.location')
    await userEvent.clear(locInput)
    await userEvent.type(locInput, 'Paris')
    expect(locInput).toHaveValue('Paris')

    // 5) Category
    const catInput = screen.getByLabelText('products.category')
    await userEvent.clear(catInput)
    await userEvent.type(catInput, 'Music')
    expect(catInput).toHaveValue('Music')

    // Vérifions aussi pour une autre langue (EN)
    const tabs = screen.getAllByRole('tab')
    await userEvent.click(tabs[1]) // bascule sur EN

    const descEn = screen.getByLabelText('products.description')
    await userEvent.clear(descEn)
    await userEvent.type(descEn, 'NewDescEN')
    expect(descEn).toHaveValue('NewDescEN')
  })

  it('shows API image URL in preview when no imageFile but translations.en.image is set', () => {
    // Modifie les initialValues pour avoir un nom de fichier en EN
    const customInit = {
      ...initialValues,
      translations: {
        ...initialValues.translations,
        en: {
          ...initialValues.translations.en,
          product_details: {
            ...initialValues.translations.en.product_details,
            image: 'remote.png'
          }
        }
      }
    }
    render(
      <ProductForm
        initialValues={customInit}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    // Le mock de ImageDropzone affiche dans data-testid="preview" le previewUrl
    const preview = screen.getByTestId('preview')
    expect(preview.textContent).toBe(
      `${API_BASE_URL}/products/images/remote.png`
    )
  })

  it('disables Save button and shows saving text when saving=true', () => {
    render(
      <ProductForm
        initialValues={initialValues}
        saving={true}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
    const saveBtn = screen.getByRole('button', { name: 'products.saving' })
    expect(saveBtn).toBeDisabled()
  })

  it('uses API image when no imageFile and correctly switches through all tabs including DE and edits name', async () => {
    // Prépare initialValues avec image en EN
    const customInit = {
      ...initialValues,
      translations: {
        ...initialValues.translations,
        en: {
          ...initialValues.translations.en,
          product_details: {
            ...initialValues.translations.en.product_details,
            image: 'remote.png'
          }
        }
      }
    }
    render(
      <ProductForm
        initialValues={customInit}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    // Le previewUrl doit être l'URL distante
    expect(screen.getByTestId('preview').textContent).toBe(
      `${API_BASE_URL}/products/images/remote.png`
    )

    // Vérifie qu'il y a 3 onglets (FR, EN, DE) et bascule successivement
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)

    // Onglet FR par défaut
    expect(screen.getByText('Flag:FR')).toBeInTheDocument()
    // Passe à EN
    await userEvent.click(tabs[1])
    expect(screen.getByText('Flag:US')).toBeInTheDocument()
    // Passe à DE
    await userEvent.click(tabs[2])
    expect(screen.getByText('Flag:DE')).toBeInTheDocument()

    // Modifie le champ name en DE
    const nameDeInput = screen.getByLabelText('products.name')
    await userEvent.clear(nameDeInput)
    await userEvent.type(nameDeInput, 'NewNameDE')
    expect(nameDeInput).toHaveValue('NewNameDE')
  })

  it('passes undefined previewUrl when no imageFile and no remote image', () => {
    // Prépare initialValues sans image en EN
    const customInit = {
      ...initialValues,
      translations: {
        ...initialValues.translations,
        en: {
          ...initialValues.translations.en,
          product_details: {
            ...initialValues.translations.en.product_details,
            image: '',       // pas de nom de fichier distant
          }
        }
      }
    }

    render(
      <ProductForm
        initialValues={customInit}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    // Le mock de ImageDropzone affiche previewUrl ou 'no-preview'
    const preview = screen.getByTestId('preview')
    expect(preview.textContent).toBe('no-preview')
  })

  it('DatePicker initial shows empty when date is empty and typing empty yields empty iso', async () => {
    const noDateInit: ProductFormData = {
      ...initialValues,
      translations: {
        fr: { ...initialValues.translations.fr, product_details: { ...initialValues.translations.fr.product_details, date: '' } },
        en: { ...initialValues.translations.en, product_details: { ...initialValues.translations.en.product_details, date: '' } },
        de: { ...initialValues.translations.de, product_details: { ...initialValues.translations.de.product_details, date: '' } }
      }
    }
    let submittedData!: ProductFormData
    const onSubmitSpy = vi.fn(async data => { submittedData = data; return false })

    renderForm(noDateInit, false, onSubmitSpy, onCancel)

    const dateInput = screen.getByTestId('date-picker') as HTMLInputElement
    expect(dateInput.value).toBe('')

    fireEvent.change(dateInput, { target: { value: '' } })
    await userEvent.click(screen.getByRole('button', { name: 'products.save' }))

    expect(onSubmitSpy).toHaveBeenCalledOnce()
    expect(submittedData.translations.fr.product_details.date).toBe('')
  })

  it('sale field fallback to 0% when emptied', async () => {
    renderForm(initialValues, false, onSubmit, onCancel)
    const saleInput = screen.getByLabelText('products.sale')
    await userEvent.clear(saleInput)
    await userEvent.type(saleInput, 'abc')
    expect(screen.getByDisplayValue('0')).toBeInTheDocument()
  })

  it('DatePicker initial shows empty when date is empty and typing empty yields empty iso', async () => {
    // 1) Prep initialValues avec date vide en EN uniquement
    const noDateInitEn = {
      ...initialValues,
      translations: {
        ...initialValues.translations,
        en: {
          ...initialValues.translations.en,
          product_details: {
            ...initialValues.translations.en.product_details,
            date: ''
          }
        }
      }
    }

    let submittedData: any
    const onSubmitSpy = vi.fn(async (data: any) => {
      submittedData = data
      return false
    })

    render(
      <ProductForm
        initialValues={noDateInitEn}
        saving={false}
        onSubmit={onSubmitSpy}
        onCancel={onCancel}
      />
    )

    // 2) Bascule sur l'onglet EN
    const tabs = screen.getAllByRole('tab')
    await userEvent.click(tabs[1])  // EN

    const dateInput = screen.getByTestId('date-picker') as HTMLInputElement
    expect(dateInput.value).toBe('')

    fireEvent.change(dateInput, { target: { value: '' } })
    await userEvent.click(screen.getByRole('button', { name: 'products.save' }))

    expect(onSubmitSpy).toHaveBeenCalledOnce()
    expect(submittedData.translations.en.product_details.date).toBe('')
  })
})

describe('<ProductForm /> additional branches', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  })
  const onCancel = vi.fn();
  const onSubmit = vi.fn(async () => true);
  const baseInit = {
    price: 1,
    sale: 0,
    stock_quantity: 1,
    imageFile: undefined as File|undefined,
    translations: {
      fr: { name: 'F', product_details: { places: 1, description: 'D', date: '2025-01-01', time: '12:00', location: 'L', category: 'C', image: '', imageFile: undefined } },
      en: { name: 'E', product_details: { places: 1, description: 'D', date: '2025-01-01', time: '12:00', location: 'L', category: 'C', image: '', imageFile: undefined } },
      de: { name: 'G', product_details: { places: 1, description: 'D', date: '2025-01-01', time: '12:00', location: 'L', category: 'C', image: '', imageFile: undefined } },
    }
  }

  it('affiche l’image préchargée si product_details.image est défini', () => {
    // Supprime le stub createObjectURL pour forcer fallback sur previewUrl distant
    // @ts-ignore
    delete global.URL.createObjectURL;

    const initWithRemote: ProductFormData = {
      ...baseInit,
      translations: {
        ...baseInit.translations,
        en: {
          ...baseInit.translations.en,
          product_details: {
            ...baseInit.translations.en.product_details,
            image: 'pic.jpg'
          }
        }
      }
    };

    render(
      <ProductForm
        initialValues={initWithRemote}
        saving={false}
        onSubmit={async () => true}
        onCancel={() => {}}
      />
    );

    const preview = screen.getByTestId('preview');
    expect(preview.textContent).toBe(
      `${API_BASE_URL}/products/images/pic.jpg`
    );
  });

  it('affiche "no-preview" si aucune image ni fichier', () => {
    // Toujours sans stub, pour avoir previewUrl=undefined
    // @ts-ignore
    delete global.URL.createObjectURL;

    render(
      <ProductForm
        initialValues={baseInit}
        saving={false}
        onSubmit={async () => true}
        onCancel={() => {}}
      />
    );

    const preview = screen.getByTestId('preview');
    expect(preview.textContent).toBe('no-preview');
  });

  it('désactive le bouton Save et affiche le spinner quand saving=true', () => {
    render(
      <ProductForm
        initialValues={baseInit}
        saving={true}
        onSubmit={async () => false}
        onCancel={() => {}}
      />
    );
    const btn = screen.getByRole('button', { name: 'products.saving' });
    expect(btn).toBeDisabled();
    // Ton mock de DatePicker/Flag/Icon n’affecte pas le spinner de MUI
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('réinitialise formData et tabIndex quand initialValues change', () => {
    const { rerender } = render(
      <ProductForm
        initialValues={baseInit}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    // modifie le champ
    fireEvent.change(screen.getByLabelText('products.name'), { target: { value: 'XYZ' } })
    expect(screen.getByDisplayValue('XYZ')).toBeInTheDocument()

    // rerender avec new init
    const modified = {
      ...baseInit,
      translations: {
        ...baseInit.translations,
        fr: { ...baseInit.translations.fr, name: 'ResetFR' }
      }
    }
    rerender(
      <ProductForm
        initialValues={modified}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    expect(screen.getByDisplayValue('ResetFR')).toBeInTheDocument()
    expect(screen.getByText('Flag:FR')).toBeInTheDocument()
  })

  it('priorise imageFile puis retombe sur remote quand imageFile est vidé', async () => {
    // 1) init avec remote.png
    const customInit = {
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
    const { rerender } = render(
      <ProductForm
        initialValues={customInit}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    // 2) dropFile → blob:mock-url
    await userEvent.click(screen.getByText('DropFile'))
    expect(screen.getByTestId('preview').textContent).toContain('blob:mock-url')

    // 3) on « vide » l’image en rerendant avec imageFile = undefined
    rerender(
      <ProductForm
        initialValues={{ ...customInit, imageFile: undefined }}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    // et là, le fallback se fera sur l’image distante
    expect(screen.getByTestId('preview').textContent).toBe(
      `${API_BASE_URL}/products/images/remote.png`
    )
  })
})