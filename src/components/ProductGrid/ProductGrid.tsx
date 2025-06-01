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

export function ProductGrid({ products, fmtCur, fmtDate, onViewDetails, onBuy }: Props) {
  const { t } = useTranslation('ticket');
  if (products.length === 0) {
    return <Typography variant='h4' sx={{ textAlign: 'center' }}>{t('tickets.not_found')}</Typography>;
  }
  return (
    <Box sx={{ display: 'flex', gap: 4, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, flexDirection: { xs: 'row', md: 'column' }}}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} fmtCur={fmtCur} fmtDate={fmtDate} onViewDetails={onViewDetails} onBuy={() => onBuy(p)} />
      ))}
    </Box>
  );
}
