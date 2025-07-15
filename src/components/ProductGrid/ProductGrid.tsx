import type { Product } from '../../types/products';
import { ProductCard } from '../ProductCard';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

interface Props {
  products: Product[];
  fmtCur: (n:number)=>string;
  fmtDate: (s?:string)=>string;
  onViewDetails: (id: number) => void;
  onBuy: (product: Product) => void;
}

/**
 * Renders a responsive grid of ProductCard components, or a “not found” message when there are no products.
 * The grid adjusts its layout based on screen size, displaying products in a row on larger screens and wrapping them on smaller screens. 
 */
export function ProductGrid({ products, fmtCur, fmtDate, onViewDetails, onBuy }: Props) {
  const { t } = useTranslation('ticket');

  // If no products, show a centered “not found” message
  if (products.length === 0) {
    return <Typography variant='h4' sx={{ textAlign: 'center' }}>{t('tickets.not_found')}</Typography>;
  }

  // Otherwise, render each product in a flex-wrapped grid
  return (
    <Box sx={{ display: 'flex', gap: 4, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, flexDirection: { xs: 'row', md: 'column' }}}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} fmtCur={fmtCur} fmtDate={fmtDate} onViewDetails={onViewDetails} onBuy={() => onBuy(p)} />
      ))}
    </Box>
  );
}
