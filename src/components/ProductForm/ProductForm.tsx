import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProductFormData } from '../../types/admin';
import { ImageDropzone } from '../ImageDropzone';
import { API_BASE_URL } from '../../config';
import FlagIcon from '../FlagIcon';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { CountryCode } from '../FlagIcon';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

// Supported languages with their locale code and flag country code
const LANGUAGES = [
  { code: 'fr', country: 'FR' as CountryCode },
  { code: 'en', country: 'US' as CountryCode },
  { code: 'de', country: 'DE' as CountryCode },
] as const;

type LangCode = 'fr' | 'en' | 'de';

interface ProductFormProps {
  initialValues: ProductFormData;
  saving: boolean;
  onSubmit: (formData: ProductFormData) => Promise<boolean>;
  onCancel: () => void;
}

/**
 * A multi-language product form for admins, with tabs for each locale, image upload, date picker, and global settings.
 */
export function ProductForm({
  initialValues,
  saving,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const { t } = useTranslation('adminProducts');
  // Form state
  const [formData, setFormData] = useState<ProductFormData>(initialValues);
  // Active language tab index
  const [tabIndex, setTabIndex] = useState(0);
  const activeLang = useMemo(() => LANGUAGES[tabIndex].code as LangCode, [tabIndex]);

   // Reset form when initialValues change
  useEffect(() => {
    setFormData(initialValues);
    setTabIndex(0);
  }, [initialValues]);

  // Track dirty state (any changes from initial)
  const [isDirty, setIsDirty] = useState(false);
  useEffect(() => {
    setIsDirty(JSON.stringify(formData) !== JSON.stringify(initialValues));
  }, [formData, initialValues]);

  // Determine if all required fields are filled
  const allFilled = useMemo(() => {
    // Must have an image either new or existing
    const hasImage = Boolean(formData.imageFile) || Boolean(formData.translations.en.product_details.image);
    if (!hasImage) return false;
    // Check global numeric fields
    if (formData.price <= 0) return false;
    if (formData.stock_quantity < 0) return false;

    // Check each locale translation
    for (const code of ['fr','en','de'] as const) {
      const tr = formData.translations[code];
      if (!tr.name) return false;
      if (!tr.product_details.date) return false;
      if (!tr.product_details.time) return false;
      if (!tr.product_details.location) return false;
      if (!tr.product_details.category) return false;
      if (tr.product_details.places <= 0) return false;
      if (!tr.product_details.description) return false;
    }
    return true;
  }, [formData]);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, idx: number) => {
    setTabIndex(idx);
  };

  // Save handler
  const handleSave = async () => {
    const ok = await onSubmit(formData);
    if (ok) onCancel();
  };

  return (
    <>
      {/* Dialog content area */}
      <DialogContent dividers>
        {/* Global fields: price, sale percent, stock */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <TextField
            label={t('products.price')}
            type="number"
            value={formData.price}
            onChange={e => setFormData(fd => ({ ...fd, price: parseFloat(e.target.value) }))}
            slotProps={{
              input: {
                endAdornment: (
                  <Chip label="€" size="small" />
                ),
              },
            }}   
            size="small"
          />
          <TextField
            label={t('products.sale')}
            type="number"
            value={formData.sale * 100}
            onChange={e => setFormData(fd => ({ ...fd, sale: (parseFloat(e.target.value) || 0) / 100 }))}
            slotProps={{
              input: {
                endAdornment: (
                  <Chip label="%" size="small" />
                ),
              },
            }}          
            size="small"
          />
          <TextField
            label={t('products.stock')}
            type="number"
            value={formData.stock_quantity}
            onChange={e => setFormData(fd => ({ ...fd, stock_quantity: parseInt(e.target.value, 10) }))}
            size="small"
          />
        </Box>

        {/* Image upload dropzone */}
        <Box sx={{ mb: 2 }}>
          <ImageDropzone
            previewUrl={
              formData.imageFile
                ? URL.createObjectURL(formData.imageFile)
                : formData.translations.en.product_details.image
                ? `${API_BASE_URL}/products/images/${formData.translations.en.product_details.image}`
                : undefined
            }
            label={t('products.image_here')}
            onFileSelected={file => setFormData(fd => ({ ...fd, imageFile: file ?? undefined }))}
          />
        </Box>

        {/* Language tabs */}
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {LANGUAGES.map(L => (
            <Tab
              key={L.code}
              icon={<FlagIcon code={L.country} width={24} height={16} />}
              aria-label={L.code.toUpperCase()}
            />
          ))}
        </Tabs>

        {/* Active-language form */}
        {(() => {
          const code = activeLang;
          const tr = formData.translations[code];
          return (
            <Box component="form" noValidate sx={{ mt: 2 }}>
              {/* Name */}
              <TextField
                fullWidth
                label={t('products.name')}
                value={tr.name}
                onChange={e =>
                  setFormData(fd => ({
                    ...fd,
                    translations: {
                      ...fd.translations,
                      [code]: { ...tr, name: e.target.value },
                    },
                  }))
                }
                sx={{ mb: 2 }}
              />
              {/* Description */}
              <TextField
                fullWidth
                multiline
                minRows={3}
                label={t('products.description')}
                value={tr.product_details.description}
                onChange={e =>
                  setFormData(fd => ({
                    ...fd,
                    translations: {
                      ...fd.translations,
                      [code]: {
                        ...tr,
                        product_details: { ...tr.product_details, description: e.target.value },
                      },
                    },
                  }))
                }
                sx={{ mb: 2 }}
              />
              {/* Date, time, places */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <TextField
                  label={t('products.place')}
                  type="number"
                  fullWidth
                  value={tr.product_details.places}
                  onChange={e =>
                    setFormData(fd => ({
                      ...fd,
                      translations: {
                        ...fd.translations,
                        [code]: {
                          ...tr,
                          product_details: { ...tr.product_details, places: parseInt(e.target.value, 10) },
                        },
                      },
                    }))
                  }
                  size="small"
                />

                <DatePicker
                  label={t('products.date')}
                  value={tr.product_details.date ? dayjs(tr.product_details.date) : null}
                  onChange={(newVal: Dayjs | null) => {
                    const iso = newVal ? newVal.format('YYYY-MM-DD') : '';
                    setFormData(fd => ({
                      ...fd,
                      translations: {
                        ...fd.translations,
                        [code]: {
                          ...tr,
                          product_details: { ...tr.product_details, date: iso },
                        },
                      },
                    }));
                  }}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true, InputLabelProps: { shrink: true } },
                  }}
                />

                <TextField
                  label={t('products.time')}
                  value={tr.product_details.time}
                  fullWidth
                  onChange={e =>
                    setFormData(fd => ({
                      ...fd,
                      translations: {
                        ...fd.translations,
                        [code]: {
                          ...tr,
                          product_details: { ...tr.product_details, time: e.target.value },
                        },
                      },
                    }))
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                  size="small"
                />
              </Box>

              {/* Location and category */}
              <TextField
                fullWidth
                label={t('products.location')}
                value={tr.product_details.location}
                onChange={e =>
                  setFormData(fd => ({
                    ...fd,
                    translations: {
                      ...fd.translations,
                      [code]: {
                        ...tr,
                        product_details: { ...tr.product_details, location: e.target.value },
                      },
                    },
                  }))
                }
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label={t('products.category')}
                value={tr.product_details.category}
                onChange={e =>
                  setFormData(fd => ({
                    ...fd,
                    translations: {
                      ...fd.translations,
                      [code]: {
                        ...tr,
                        product_details: { ...tr.product_details, category: e.target.value },
                      },
                    },
                  }))
                }
              />
            </Box>
          );
        })()}
      </DialogContent>

      {/* Action buttons */}
      <DialogActions>
        <Button onClick={onCancel}>{t('products.close')}</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!allFilled || !isDirty || saving}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {saving ? t('products.saving') : t('products.save')}
        </Button>
      </DialogActions>
    </>
  );
}
