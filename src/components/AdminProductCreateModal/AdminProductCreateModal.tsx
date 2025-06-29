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

export function AdminProductCreateModal({ open, onClose, onRefresh }: Props) {
  const { t } = useTranslation('adminProducts');
  const { notify } = useCustomSnackbar();
  const createProduct = useCreateProduct();
  const [saving, setSaving] = useState(false);

  // Valeurs initiales "vierges"
  const initialValues = useMemo<ProductFormData>(() => ({
    price: 0,
    sale: 0,
    stock_quantity: 0,
    imageFile: undefined,
    translations: {
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
      <DialogTitle>
        {t('products.create_new')}
      </DialogTitle>

      <ProductForm
        initialValues={initialValues}
        saving={saving}
        onSubmit={async data => {
          setSaving(true);

          const body = new FormData();
          body.append('price', data.price.toString());
          body.append('sale', data.sale.toString());
          body.append('stock_quantity', data.stock_quantity.toString());
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
          if (data.imageFile) {
            body.append('image', data.imageFile, data.imageFile.name);
          }

          const ok = await createProduct(body);
          setSaving(false);

          if (ok) {
            notify(t('products.success'), 'success');
            onRefresh();
            return true;
          } else {
            notify(t('errors.save_failed'), 'error');
            return false;
          }
        }}
        onCancel={onClose}
      />
    </Dialog>
  );
}
