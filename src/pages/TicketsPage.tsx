// src/pages/ProductsPage.tsx
import { Typography } from '@mui/material';
import { PageWrapper } from '../components/PageWrapper';
import { Seo } from '../components/Seo';
import { useTranslation } from 'react-i18next';

export default function ProductsPage() {
  const { t } = useTranslation();
  return (
    <>
      <Seo
        title={t('products.title')}
        description={t('products.description')}
        noIndex // si tu veux que cette page ne soit pas indexée par les moteurs de recherche
      />
      <PageWrapper>
        <Typography variant="h4" gutterBottom>
          Our Products
        </Typography>
        {/* Ici tu intégreras ton DataGrid / liste de produits */}
      </PageWrapper>
    </>
  );
}
