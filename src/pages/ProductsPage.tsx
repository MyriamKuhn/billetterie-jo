// src/pages/ProductsPage.tsx
import { Typography } from '@mui/material';
import { PageWrapper } from '../components/PageWrapper';

export default function ProductsPage() {
  return (
    <PageWrapper>
      <Typography variant="h4" gutterBottom>
        Our Products
      </Typography>
      {/* Ici tu intégreras ton DataGrid / liste de produits */}
    </PageWrapper>
  );
}
