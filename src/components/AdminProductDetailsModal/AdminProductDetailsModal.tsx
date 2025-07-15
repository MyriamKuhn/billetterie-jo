import { useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import { useProductDetailsMultiLang, type LangCode } from '../../hooks/useProductDetailsMultiLang';
import { useUpdateProductDetails } from '../../hooks/useUpdateProductDetails';
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

/**
 * Modal for editing existing product details in multiple languages.
 *
 * - Fetches current data when opened.
 * - Shows loader or error states appropriately.
 * - Initializes form with fetched data.
 * - Submits updates as FormData, including translations and optional image.
 */
export function AdminProductDetailsModal({ open, productId, onClose, onRefresh }: Props) {
  const { t } = useTranslation('adminProducts');
  const { notify } = useCustomSnackbar();
  const updateProductDetails = useUpdateProductDetails();

  // Fetch translations only when modal is open
  const { data: allTranslations, loading, error } =
    useProductDetailsMultiLang(open ? productId : null, ['fr','en','de']);

  // Prepare initial form values once data is available
  const initialValues = useMemo<ProductFormData | null>(() => {
    if (!allTranslations) return null;
    const en = allTranslations.en;
    return {
      price: en.price,
      sale: en.sale,
      stock_quantity: en.stock_quantity,
      imageFile: undefined,
      translations: {
        fr: { name: allTranslations.fr.name, product_details: { ...allTranslations.fr.product_details, imageFile: undefined } },
        en: { name: allTranslations.en.name, product_details: { ...allTranslations.en.product_details, imageFile: undefined } },
        de: { name: allTranslations.de.name, product_details: { ...allTranslations.de.product_details, imageFile: undefined } },
      },
    };
  }, [allTranslations]);

  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Title with interpolated product ID */}
      <DialogTitle>
        {t('products.modification', { id: productId })}
      </DialogTitle>

      {/* Show loader when fetching data */}
      {loading && <Box textAlign="center" py={4}><OlympicLoader/></Box>}
      {/* Show error display if fetch failed */}
      {error && <ErrorDisplay title={t('errors.title')} message={t('errors.not_found')} />}

      {/* Render form once data loaded and no error */}
      {!loading && !error && initialValues && (
        <ProductForm
          initialValues={initialValues}
          saving={saving}
          /**
           * Handle form submission:
           * - Build FormData payload with basic fields and translations
           * - Append optional image file
           * - Call updateProductDetails hook
           * - Notify user and refresh on success or failure
           */
          onSubmit={async data => {
            setSaving(true);
            const body = new FormData();
            // Append global fields
            body.append('price', data.price.toString());
            body.append('sale',  data.sale.toString());
            body.append('stock_quantity', data.stock_quantity.toString());
            // Append translations for each language code
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
            // Include image if provided
            if (data.imageFile) {
              body.append('image', data.imageFile, data.imageFile.name);
            }
            const ok = await updateProductDetails(productId!, body);
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