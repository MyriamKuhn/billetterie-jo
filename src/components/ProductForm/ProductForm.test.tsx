import { vi } from 'vitest';
import dayjs from 'dayjs';

// 1) Polyfill de createObjectURL pour éviter l’erreur JSDOM
if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
}

// On mocke useTranslation pour que t('…') renvoie la clé brute
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Stub de l’ImageDropzone
vi.mock('../ImageDropzone', () => ({
  __esModule: true,
  ImageDropzone: ({ label, onFileSelected }: any) => (
    <div data-testid="dropzone">
      <span data-testid="dropzone-label">{label}</span>
      <button
        data-testid="dropzone-select"
        onClick={() => {
          const file = new File(['dummy'], 'dummy.png', { type: 'image/png' });
          onFileSelected(file);
        }}
      >
        select-file
      </button>
      <button
        data-testid="dropzone-clear"
        onClick={() => {
          onFileSelected(undefined);
        }}
      >
        clear-file
      </button>
    </div>
  ),
}));


// Stub du FlagIcon pour pouvoir matcher les onglets
vi.mock('../FlagIcon', () => ({
  __esModule: true,
  default: ({ code }: any) => <span data-testid={`flag-${code}`} />,
}));

// Stub du DatePicker pour simplifier l’input/date
vi.mock('@mui/x-date-pickers/DatePicker', () => ({
  __esModule: true,
  DatePicker: ({ label, value, onChange }: any) => (
    <input
      data-testid={`datepicker-${label}`}
      aria-label={label}
      value={value ? value.format('YYYY-MM-DD') : ''}
      onChange={e => {
        // si l’input est vide, newVal = null
        const v = e.target.value;
        onChange(v ? dayjs(v) : null);
      }}
    />
  ),
}));

// Déclarez initialValues en haut du fichier, AVANT tout describe()
const initialValues: ProductFormData = {
  price: 10,
  sale: 0.2,
  stock_quantity: 5,
  imageFile: undefined,
  translations: {
    fr: {
      name: 'Nom FR',
      product_details: {
        image: 'img_fr.png',
        date: '2025-07-01',
        time: '10:00',
        location: 'Paris',
        category: 'Cat FR',
        places: 10,
        description: 'Desc FR',
      },
    },
    en: {
      name: 'Name EN',
      product_details: {
        image: 'img_en.png',
        date: '2025-07-02',
        time: '11:00',
        location: 'London',
        category: 'Cat EN',
        places: 20,
        description: 'Desc EN',
      },
    },
    de: {
      name: 'Name DE',
      product_details: {
        image: 'img_de.png',
        date: '2025-07-03',
        time: '12:00',
        location: 'Berlin',
        category: 'Cat DE',
        places: 30,
        description: 'Desc DE',
      },
    },
  },
};

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductForm } from './ProductForm';
import type { ProductFormData } from '../../types/admin';

describe('ProductForm', () => {
  const initialValues: ProductFormData = {
    price: 10,
    sale: 0.2,
    stock_quantity: 5,
    imageFile: undefined,
    translations: {
      fr: {
        name: 'Nom FR',
        product_details: {
          image: 'img_fr.png',
          date: '2025-07-01',
          time: '10:00',
          location: 'Paris',
          category: 'Cat FR',
          places: 10,
          description: 'Desc FR',
        },
      },
      en: {
        name: 'Name EN',
        product_details: {
          image: 'img_en.png',
          date: '2025-07-02',
          time: '11:00',
          location: 'London',
          category: 'Cat EN',
          places: 20,
          description: 'Desc EN',
        },
      },
      de: {
        name: 'Name DE',
        product_details: {
          image: 'img_de.png',
          date: '2025-07-03',
          time: '12:00',
          location: 'Berlin',
          category: 'Cat DE',
          places: 30,
          description: 'Desc DE',
        },
      },
    },
  };

  it('rend tous les champs initiaux et désactive Save', () => {
  render(
    <ProductForm
      initialValues={initialValues}
      saving={false}
      onSubmit={vi.fn()}
      onCancel={vi.fn()}
    />
  );

  // champs globaux
  expect(screen.getByLabelText('products.price')).toHaveValue(10);
  expect(screen.getByLabelText('products.sale')).toHaveValue(20);
  expect(screen.getByLabelText('products.stock')).toHaveValue(5);

  // on vérifie simplement le texte de label du dropzone
  expect(screen.getByText('products.image_here')).toBeInTheDocument();

  // onglets de langue
  expect(screen.getByTestId('flag-FR')).toBeInTheDocument();
  expect(screen.getByTestId('flag-US')).toBeInTheDocument();
  expect(screen.getByTestId('flag-DE')).toBeInTheDocument();

  // bouton Save désactivé
  expect(screen.getByRole('button', { name: 'products.save' })).toBeDisabled();
});

  it('permet d’éditer, active le bouton Save, appelle onSubmit et then onCancel', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();

    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // Modifier le prix
    const priceInput = screen.getByLabelText('products.price');
    fireEvent.change(priceInput, { target: { value: '15' } });
    expect(priceInput).toHaveValue(15);

    // Maintenant le form est "dirty" ET allFilled reste vrai => Save activé
    const saveBtn = screen.getByRole('button', { name: 'products.save' });
    expect(saveBtn).toBeEnabled();

    // Cliquer sur Save déclenche onSubmit
    fireEvent.click(saveBtn);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ price: 15 })
      )
    );
    // et si onSubmit renvoie true, onCancel est appelé
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });

  it('change d’onglet quand on clique sur EN ou DE', () => {
    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Par défaut on voit le champ name en FR
    expect(screen.getByLabelText('products.name')).toHaveValue('Nom FR');

    // Cliquer sur l’onglet EN
    fireEvent.click(screen.getByLabelText('EN'));
    expect(screen.getByLabelText('products.name')).toHaveValue('Name EN');

    // Cliquer sur l’onglet DE
    fireEvent.click(screen.getByLabelText('DE'));
    expect(screen.getByLabelText('products.name')).toHaveValue('Name DE');
  });

  it('appelle onCancel quand on clique sur "Close"', () => {
    const onCancel = vi.fn();
    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'products.close' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('modifie sale, stock et sélectionne un fichier via dropzone', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();
    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // sale → 50% (input value 50)
    const saleInput = screen.getByLabelText('products.sale');
    fireEvent.change(saleInput, { target: { value: '50' } });
    expect(saleInput).toHaveValue(50);

    // stock → 15
    const stockInput = screen.getByLabelText('products.stock');
    fireEvent.change(stockInput, { target: { value: '15' } });
    expect(stockInput).toHaveValue(15);

    // sélection du fichier
    fireEvent.click(screen.getByTestId('dropzone-select'));

    // Save devient actif
    const saveBtn = screen.getByRole('button', { name: 'products.save' });
    expect(saveBtn).toBeEnabled();

    // clic sur Save → onSubmit puis onCancel
    fireEvent.click(saveBtn);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          sale: 0.5,
          stock_quantity: 15,
          imageFile: expect.any(File),
        })
      )
    );
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });

  it('permet d’éditer tous les champs de traduction et active Save', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();

    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // 1) Changer le nom
    const nameInput = screen.getByLabelText('products.name');
    fireEvent.change(nameInput, { target: { value: 'Updated Name FR' } });
    expect(nameInput).toHaveValue('Updated Name FR');

    // 2) Changer la description
    const descInput = screen.getByLabelText('products.description');
    fireEvent.change(descInput, { target: { value: 'Updated Desc FR' } });
    expect(descInput).toHaveValue('Updated Desc FR');

    // 3) Changer le nombre de places
    const placeInput = screen.getByLabelText('products.place');
    fireEvent.change(placeInput, { target: { value: '42' } });
    expect(placeInput).toHaveValue(42);

    // 4) Changer la date via le stub DatePicker
    const dateInput = screen.getByTestId('datepicker-products.date');
    fireEvent.change(dateInput, { target: { value: '2025-09-01' } });
    expect(dateInput).toHaveValue('2025-09-01');

    // 5) Changer l’heure
    const timeInput = screen.getByLabelText('products.time');
    fireEvent.change(timeInput, { target: { value: '16:30' } });
    expect(timeInput).toHaveValue('16:30');

    // 6) Changer le lieu
    const locationInput = screen.getByLabelText('products.location');
    fireEvent.change(locationInput, { target: { value: 'Marseille' } });
    expect(locationInput).toHaveValue('Marseille');

    // 7) Changer la catégorie
    const categoryInput = screen.getByLabelText('products.category');
    fireEvent.change(categoryInput, { target: { value: 'Updated Cat FR' } });
    expect(categoryInput).toHaveValue('Updated Cat FR');

    // Tous ces changements rendent le form "dirty" et allFilled reste vrai → Save activé
    const saveBtn = screen.getByRole('button', { name: 'products.save' });
    expect(saveBtn).toBeEnabled();

    // Cliquer sur Save déclenche onSubmit avec les bonnes valeurs
    fireEvent.click(saveBtn);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          translations: expect.objectContaining({
            fr: expect.objectContaining({
              name: 'Updated Name FR',
              product_details: expect.objectContaining({
                description: 'Updated Desc FR',
                places: 42,
                date: '2025-09-01',
                time: '16:30',
                location: 'Marseille',
                category: 'Updated Cat FR',
              }),
            }),
          }),
        })
      )
    );

    // Et si onSubmit renvoie true, onCancel est appelé
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });

  it('désactive Save si le prix est <= 0 même si tout le reste est valide', () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();

    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // Tout est valide au départ → on modifie juste le prix à 0
    const priceInput = screen.getByLabelText('products.price');
    fireEvent.change(priceInput, { target: { value: '0' } });
    expect(priceInput).toHaveValue(0);

    // Save doit rester désactivé (price <= 0)
    expect(screen.getByRole('button', { name: 'products.save' })).toBeDisabled();
  });

  it('désactive Save quand il n’y a pas d’image', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    // on clone initialValues en retirant le champ image de la langue EN
    const noImageValues: ProductFormData = {
      ...initialValues,
      translations: {
        ...initialValues.translations,
        en: {
          ...initialValues.translations.en,
          product_details: {
            ...initialValues.translations.en.product_details,
            image: '', // plus d’image
          },
        },
      },
    };

    render(
      <ProductForm
        initialValues={noImageValues}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // Même si tout le reste est rempli, hasImage sera false → Save désactivé
    expect(screen.getByRole('button', { name: 'products.save' })).toBeDisabled();
  });

  it('n’appelle pas onCancel si onSubmit renvoie false', async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    const onCancel = vi.fn();

    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // On rend le form "dirty" sans casser allFilled, par exemple en changeant le stock
    const stockInput = screen.getByLabelText('products.stock');
    fireEvent.change(stockInput, { target: { value: '10' } });
    expect(stockInput).toHaveValue(10);

    // Save doit maintenant être activé
    const saveBtn = screen.getByRole('button', { name: 'products.save' });
    expect(saveBtn).toBeEnabled();

    // On clique et onSubmit renvoie false
    fireEvent.click(saveBtn);
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    // onCancel ne doit PAS avoir été appelé
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe('allFilled validation exhaustive', () => {
  const renderWith = (overrides: Partial<ProductFormData>) => {
    // Clone en profondeur pour ne pas muter initialValues
    const broken: ProductFormData = JSON.parse(JSON.stringify(initialValues));
    Object.assign(broken, overrides);
    render(
      <ProductForm
        initialValues={broken}
        saving={false}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    return screen.getByRole('button', { name: 'products.save' });
  };

  it('désactive Save quand stock_quantity < 0', () => {
    const saveBtn = renderWith({ stock_quantity: -1 });
    expect(saveBtn).toBeDisabled();
  });

  it('désactive Save quand `name` manquant en FR', () => {
    const broken = JSON.parse(JSON.stringify(initialValues));
    broken.translations.fr.name = '';
    const saveBtn = renderWith({ translations: broken.translations });
    expect(saveBtn).toBeDisabled();
  });

  it('désactive Save quand `date` manquant en FR', () => {
    const broken = JSON.parse(JSON.stringify(initialValues));
    broken.translations.fr.product_details.date = '';
    const saveBtn = renderWith({ translations: broken.translations });
    expect(saveBtn).toBeDisabled();
  });

  it('désactive Save quand `time` manquant en FR', () => {
    const broken = JSON.parse(JSON.stringify(initialValues));
    broken.translations.fr.product_details.time = '';
    const saveBtn = renderWith({ translations: broken.translations });
    expect(saveBtn).toBeDisabled();
  });

  it('désactive Save quand `location` manquant en FR', () => {
    const broken = JSON.parse(JSON.stringify(initialValues));
    broken.translations.fr.product_details.location = '';
    const saveBtn = renderWith({ translations: broken.translations });
    expect(saveBtn).toBeDisabled();
  });

  it('désactive Save quand `category` manquant en FR', () => {
    const broken = JSON.parse(JSON.stringify(initialValues));
    broken.translations.fr.product_details.category = '';
    const saveBtn = renderWith({ translations: broken.translations });
    expect(saveBtn).toBeDisabled();
  });

  it('désactive Save quand `places` <= 0 en FR', () => {
    const broken = JSON.parse(JSON.stringify(initialValues));
    broken.translations.fr.product_details.places = 0;
    const saveBtn = renderWith({ translations: broken.translations });
    expect(saveBtn).toBeDisabled();
  });

  it('désactive Save quand `description` manquante en FR', () => {
    const broken = JSON.parse(JSON.stringify(initialValues));
    broken.translations.fr.product_details.description = '';
    const saveBtn = renderWith({ translations: broken.translations });
    expect(saveBtn).toBeDisabled();
  });

  it('transforme correctement la valeur sale (%) en fraction dans formData', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();

    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // 1) On tape "75" dans le champ sale (affiché en %)
    const saleInput = screen.getByLabelText('products.sale');
    fireEvent.change(saleInput, { target: { value: '75' } });
    // l'input reflète bien 75
    expect(saleInput).toHaveValue(75);

    // 2) On clique sur Save pour déclencher onSubmit
    const saveBtn = screen.getByRole('button', { name: 'products.save' });
    expect(saveBtn).toBeEnabled();
    fireEvent.click(saveBtn);

    // 3) onSubmit doit recevoir sale = 0.75 (75/100)
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ sale: 0.75 })
      );
    });
  });

  it('met à jour imageFile via onFileSelected et l’envoie à onSubmit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();

    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // 1) Simule la sélection de fichier via notre stub ImageDropzone
    fireEvent.click(screen.getByTestId('dropzone-select'));

    // Le formulaire est devenu dirty et allFilled reste vrai → Save activé
    const saveBtn = screen.getByRole('button', { name: 'products.save' });
    expect(saveBtn).toBeEnabled();

    // 2) Clique sur Save pour déclencher onSubmit
    fireEvent.click(saveBtn);

    // 3) Vérifie que onSubmit a bien reçu imageFile (notre File factice)
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          imageFile: expect.any(File),
        })
      )
    );

    // Et si onSubmit renvoie true, onCancel est appelé
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });

  it('vide la date (newVal=null) et désactive Save', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // On commence sur FR, le datepicker contient "2025-07-01"
    const dateInput = screen.getByTestId('datepicker-products.date');
    expect(dateInput).toHaveValue('2025-07-01');

    // On vide le champ → stub appelle onChange(null) → iso = ''
    fireEvent.change(dateInput, { target: { value: '' } });
    expect(dateInput).toHaveValue(''); // formData.translations.fr.product_details.date === ''

    // Comme date est vide, allFilled doit être false → Save désactivé
    expect(screen.getByRole('button', { name: 'products.save' })).toBeDisabled();
  });

  it('affiche le spinner et le texte "products.saving" quand saving=true', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <ProductForm
        initialValues={initialValues}
        saving={true}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // Le bouton doit afficher "products.saving" et être désactivé
    const saveBtn = screen.getByRole('button', { name: 'products.saving' });
    expect(saveBtn).toBeDisabled();

    // Le CircularProgress doit apparaître comme startIcon
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('transforme sale (%) en fraction via onChange et soumet la bonne valeur', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();

    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // 1) Modifier sale à 80%
    const saleInput = screen.getByLabelText('products.sale');
    fireEvent.change(saleInput, { target: { value: '80' } });
    expect(saleInput).toHaveValue(80);

    // 2) Le formulaire est "dirty" et allFilled reste vrai → Save activé
    const saveBtn = screen.getByRole('button', { name: 'products.save' });
    expect(saveBtn).toBeEnabled();

    // 3) Cliquer sur Save pour déclencher onSubmit
    fireEvent.click(saveBtn);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ sale: 0.8 })
      )
    );
    // et onCancel doit être appelé
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });

  it('met à jour imageFile via onFileSelected et le revoie à onSubmit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();

    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // 1) Simuler la sélection de fichier (notre stub ImageDropzone expose #dropzone-select)
    fireEvent.click(screen.getByTestId('dropzone-select'));

    // 2) Save s’active
    const saveBtn = screen.getByRole('button', { name: 'products.save' });
    expect(saveBtn).toBeEnabled();

    // 3) Cliquer sur Save → onSubmit doit recevoir imageFile
    fireEvent.click(saveBtn);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ imageFile: expect.any(File) })
      )
    );
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });
});

describe('branchement parseFloat || 0 et clear-file', () => {
  it('met sale à 0 quand la saisie n’est pas un nombre', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();
    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // 1) Saisir "abc" dans sale → parseFloat('abc') = NaN → (NaN||0)/100 = 0
    const saleInput = screen.getByLabelText('products.sale');
    fireEvent.change(saleInput, { target: { value: 'abc' } });
    // la valeur de l’input reflète sale*100 === 0
    expect(saleInput).toHaveValue(0);

    // 2) Submit et vérification
    const saveBtn = screen.getByRole('button', { name: 'products.save' });
    expect(saveBtn).toBeEnabled();
    fireEvent.click(saveBtn);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ sale: 0 })
      )
    );
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });

  it('clear-file appelle onFileSelected(undefined) et désactive Save après activation', () => {
    render(
      <ProductForm
        initialValues={initialValues}
        saving={false}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // 1) Au départ, Save est désactivé
    const saveBtn = screen.getByRole('button', { name: 'products.save' });
    expect(saveBtn).toBeDisabled();

    // 2) Sélection d’un fichier : Save s’active
    fireEvent.click(screen.getByTestId('dropzone-select'));
    expect(screen.getByRole('button', { name: 'products.save' })).toBeEnabled();

    // 3) Clear-file : appel du handler avec undefined → form redevient “clean”
    fireEvent.click(screen.getByTestId('dropzone-clear'));

    // 4) Save repasse en désactivé, prouvant que l’état a été mis à jour par onFileSelected(undefined)
    expect(screen.getByRole('button', { name: 'products.save' })).toBeDisabled();
  });
});
