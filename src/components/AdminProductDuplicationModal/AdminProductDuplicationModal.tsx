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
  open: boolean;              // Controls visibility of the modal
  productId: number | null;   // ID of the product to duplicate
  lang: string;               // Current UI language (not used directly here)
  onClose: () => void;        // Callback to close the modal
  onRefresh: () => void;      // Callback to refresh parent data on success
}

/**
 * Modal component to duplicate an existing product, preserving multi-language data.
 *
 * - Fetches original product translations when opened.
 * - Shows loader and error states as needed.
 * - Initializes the duplication form with fetched values.
 * - Submits a new product via FormData payload (including optional image).
 */
export function AdminProductDuplicationModal({ open, productId, onClose, onRefresh }: Props) {
  const { t } = useTranslation('adminProducts');
  const { notify } = useCustomSnackbar();
  const createProduct = useCreateProduct();

  // Load translations for the product only when modal is open
  const { data: allTranslations, loading, error } =
    useProductDetailsMultiLang(open ? productId : null, ['fr','en','de']);

  /**
   * Prepare the initial form values based on the English translation.
   * The imageFile is reset so a new upload can be provided.
   */
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
      {/* Header showing duplication title and product ID */}
      <DialogTitle>
        {t('products.duplication', { id: productId })}
      </DialogTitle>

      {/* Show loader while fetching translations */}
      {loading && <Box textAlign="center" py={4}><OlympicLoader/></Box>}
      {/* Show error display if fetch fails */}
      {error && <ErrorDisplay title={t('errors.title')} message={t('errors.not_found')} />}

      {/* Render the form when data is ready */}
      {!loading && !error && initialValues && (
        <ProductForm
          initialValues={initialValues}
          saving={saving}
          /**
           * Handle form submission:
           * - Assemble FormData payload with core fields and translations
           * - Attach image file if provided
           * - Invoke createProduct to duplicate the product
           * - Notify user and trigger onRefresh on success/failure
           */
          onSubmit={async data => {
            setSaving(true);
            const body = new FormData();
            // Append core product fields
            body.append('price', data.price.toString());
            body.append('sale',  data.sale.toString());
            body.append('stock_quantity', data.stock_quantity.toString());
            // Append each language's translation fields
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
            // Attach image if the user uploaded one
            if (data.imageFile) {
              body.append('image', data.imageFile, data.imageFile.name);
            }
            // Create the duplicated product
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