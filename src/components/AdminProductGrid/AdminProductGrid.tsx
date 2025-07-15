import type { Product } from '../../types/products';
import { AdminProductCard } from '../AdminProductCard';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { CreateProductCard } from '../CreateProductCard';

interface Props {
  products: Product[];  // List of products to display in the grid
  lang: string;       // Current UI language (passed down to cards)
  onViewDetails: (id: number) => void;  // Callback when a product's “View Details” is clicked
  onSave: (           // Callback to save edits on a product
    id: number, updates: {
    price: number;
    sale: number;
    stock_quantity: number;
  }) => Promise<boolean>;
  onRefresh: () => void;    // Refresh grid data after save or duplicate
  onDuplicate: (id: number) => void;    // Trigger duplication flow for a product
  onCreate: () => void;   // Open the “create new product” modal
}

/**
 * AdminProductGrid
 *
 * - Renders a CreateProductCard for adding new products.
 * - Renders an AdminProductCard for each existing product.
 * - Displays a “not found” message if the list is empty.
 */
export function AdminProductGrid({ products, lang, onViewDetails, onSave, onRefresh, onDuplicate, onCreate }: Props) {
  const { t } = useTranslation('adminProducts');

  // If no products, show an empty-state message
  if (products.length === 0) {
    return (
      <Typography variant="h4" sx={{ textAlign: 'center' }}>
        {t('errors.not_found')}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 4, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, flexDirection: { xs: 'row', md: 'column' }}}>
      {/* Card to trigger creation of a new product */}
      <CreateProductCard onCreate={onCreate} />
      {/* One AdminProductCard per product in the list */}
      {products.map(p => (
        <AdminProductCard
          key={p.id}
          product={p}
          lang={lang}
          onViewDetails={onViewDetails}
          onSave={onSave}
          onRefresh={onRefresh}
          onDuplicate={onDuplicate}
        />
      ))}
    </Box>
  );
}
