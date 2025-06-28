import type { Product } from '../../types/products';
import { AdminProductCard } from '../AdminProductCard';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

interface Props {
  products: Product[];
  lang: string;
  onViewDetails: (id: number) => void;
  onSave: (id: number, updates: {
    price: number;
    sale: number;
    stock_quantity: number;
  }) => Promise<boolean>;
  onRefresh: () => void;
}

export function AdminProductGrid({ products, lang, onViewDetails, onSave, onRefresh }: Props) {
  const { t } = useTranslation('adminProducts');

  if (products.length === 0) {
    return (
      <Typography variant="h4" sx={{ textAlign: 'center' }}>
        {t('errors.not_found')}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 4, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, flexDirection: { xs: 'row', md: 'column' }}}>
      {products.map(p => (
        <AdminProductCard
          key={p.id}
          product={p}
          lang={lang}
          onViewDetails={onViewDetails}
          onSave={onSave}
          onRefresh={onRefresh}
        />
      ))}
    </Box>
  );
}
