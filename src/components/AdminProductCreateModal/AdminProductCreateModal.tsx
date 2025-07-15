import { useState, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { useCreateProduct } from '../../hooks/useCreateProduct';
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar';
import { useTranslation } from 'react-i18next';
import type { ProductFormData } from '../../types/admin';
import { ProductForm } from '../ProductForm';

interface Props {
  open: boolean;
  lang: string;
  onClose: () => void;
  onRefresh: () => void;
}

/**
 * Modal dialog for creating a new product.
 *
 * - Displays a ProductForm with initial blank values.
 * - Submits form data as FormData, including translations and optional image.
 * - Shows snackbar notifications on success or failure.
 */
export function AdminProductCreateModal({ open, onClose, onRefresh }: Props) {
  const { t } = useTranslation('adminProducts');
  const { notify } = useCustomSnackbar();
  const createProduct = useCreateProduct();
  const [saving, setSaving] = useState(false);

  // Memoize initial blank form values to provide stable reference
  const initialValues = useMemo<ProductFormData>(() => ({
    price: 0,
    sale: 0,
    stock_quantity: 0,
    imageFile: undefined,
    translations: {
      // French translation fields
      fr: {
        name: '',
        product_details: {
          places: 0,
          description: '',
          date: '',
          time: '',
          location: '',
          category: '',
          image: '',      
          imageFile: undefined,
        },
      },
      en: {
        // English translation fields
        name: '',
        product_details: {
          places: 0,
          description: '',
          date: '',
          time: '',
          location: '',
          category: '',
          image: '',
          imageFile: undefined,
        },
      },
      de: {
        // German translation fields
        name: '',
        product_details: {
          places: 0,
          description: '',
          date: '',
          time: '',
          location: '',
          category: '',
          image: '',
          imageFile: undefined,
        },
      },
    },
  }), []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Modal title */}
      <DialogTitle>
        {t('products.create_new')}
      </DialogTitle>

      <ProductForm
        initialValues={initialValues}
        saving={saving}
        /**
         * Handle form submission:
         * - Build FormData payload including translations and optional image
         * - Call createProduct hook
         * - Notify user and refresh list on success or failure
         */
        onSubmit={async data => {
          setSaving(true);

          const body = new FormData();
          // Append basic product fields
          body.append('price', data.price.toString());
          body.append('sale', data.sale.toString());
          body.append('stock_quantity', data.stock_quantity.toString());
          // Append translation fields for each language
          (['fr','en','de'] as const).forEach(code => {
            const tr = data.translations[code];
            body.append(`translations[${code}][name]`, tr.name);
            body.append(
              `translations[${code}][product_details][places]`,
              tr.product_details.places.toString()
            );
            body.append(
              `translations[${code}][product_details][description]`,
              tr.product_details.description
            );
            body.append(
              `translations[${code}][product_details][date]`,
              tr.product_details.date
            );
            body.append(
              `translations[${code}][product_details][time]`,
              tr.product_details.time
            );
            body.append(
              `translations[${code}][product_details][location]`,
              tr.product_details.location
            );
            body.append(
              `translations[${code}][product_details][category]`,
              tr.product_details.category
            );
          });
          // Include image file if provided
          if (data.imageFile) {
            body.append('image', data.imageFile, data.imageFile.name);
          }
          // Call API and handle result
          const ok = await createProduct(body);
          setSaving(false);

          if (ok) {
            notify(t('products.success'), 'success');
            onRefresh();
            return true;  // signal success to ProductForm
          } else {
            notify(t('errors.save_failed'), 'error');
            return false; // signal failure to ProductForm
          }
        }}
        onCancel={onClose}
      />
    </Dialog>
  );
}
