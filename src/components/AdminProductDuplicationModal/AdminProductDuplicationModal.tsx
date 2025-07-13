import { useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import { useProductDetailsMultiLang, type LangCode } from '../../hooks/useProductDetailsMultiLang';
import { useCreateProduct } from '../../hooks/useCreateProduct';
import OlympicLoader from '../OlympicLoader';
import { ErrorDisplay } from '../ErrorDisplay';
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar';
import { useTranslation } from 'react-i18next';
import type { ProductFormData } from '../../types/admin';
import { ProductForm } from '../ProductForm';

interface Props {
  open: boolean;
  productId: number | null;
  lang: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function AdminProductDuplicationModal({ open, productId, onClose, onRefresh }: Props) {
  const { t } = useTranslation('adminProducts');
  const { notify } = useCustomSnackbar();
  const createProduct = useCreateProduct();

  // Charge les traductions
  const { data: allTranslations, loading, error } =
    useProductDetailsMultiLang(open ? productId : null, ['fr','en','de']);

  // Prépare les valeurs initiales du form
  const initialValues = useMemo<ProductFormData | null>(() => {
    if (!allTranslations) return null;
    const en = allTranslations.en;
    return {
      price: en.price,
      sale: en.sale,
      stock_quantity: en.stock_quantity,
      imageFile: undefined,
      translations: {
        fr: { 
          name: allTranslations.fr.name, 
          product_details: { 
            ...allTranslations.fr.product_details, 
            image: '',
            imageFile: undefined ,
          }
        },
        en: { name: allTranslations.en.name, 
          product_details: { 
            ...allTranslations.en.product_details, 
            image: '',
            imageFile: undefined ,
          }
        },
        de: { 
          name: allTranslations.de.name, 
          product_details: { 
            ...allTranslations.de.product_details, 
            image: '',
            imageFile: undefined ,
          }
        },
      },
    };
  }, [allTranslations]);

  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('products.duplication', { id: productId })}
      </DialogTitle>

      {/* Loader / Erreur */}
      {loading && <Box textAlign="center" py={4}><OlympicLoader/></Box>}
      {error && <ErrorDisplay title={t('errors.title')} message={t('errors.not_found')} />}

      {/* Formulaire */}
      {!loading && !error && initialValues && (
        <ProductForm
          initialValues={initialValues}
          saving={saving}
          onSubmit={async data => {
            setSaving(true);
            // Reconstruis ton FormData à partir de `data`
            const body = new FormData();
            // Champs globaux
            body.append('price', data.price.toString());
            body.append('sale',  data.sale.toString());
            body.append('stock_quantity', data.stock_quantity.toString());
            (['fr','en','de'] as LangCode[]).forEach(code => {
              const tr = data.translations[code];
              body.append(`translations[${code}][name]`, tr.name);
              body.append(`translations[${code}][product_details][places]`, tr.product_details.places.toString());
              body.append(`translations[${code}][product_details][description]`, tr.product_details.description);
              body.append(`translations[${code}][product_details][date]`, tr.product_details.date);
              body.append(`translations[${code}][product_details][time]`, tr.product_details.time);
              body.append(`translations[${code}][product_details][location]`, tr.product_details.location);
              body.append(`translations[${code}][product_details][category]`, tr.product_details.category);
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
      )}
    </Dialog>
  );
}