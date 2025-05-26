import type { Product } from '../../hooks/useProducts';
import { ProductCard } from '../ProductCard';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface Props {
  products: Product[];
  fmtCur: (n:number)=>string;
  fmtDate: (s?:string)=>string;
}

export function ProductGrid({ products, fmtCur, fmtDate }: Props) {
  if (products.length === 0) {
    return <Typography variant='h4' sx={{ textAlign: 'center' }}>Aucun billet trouvé</Typography>;
  }
  return (
    <Box sx={{ display: 'flex', gap: 4, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, flexDirection: { xs: 'row', md: 'column' }}}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} fmtCur={fmtCur} fmtDate={fmtDate} />
      ))}
    </Box>
  );
}
