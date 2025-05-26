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
    return <Typography>Aucun billet trouvé.</Typography>;
  }
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-start' }}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} fmtCur={fmtCur} fmtDate={fmtDate} />
      ))}
    </Box>
  );
}
