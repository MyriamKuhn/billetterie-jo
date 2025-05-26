import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import type { Product } from '../../hooks/useProducts';

interface Props { product: Product; fmtCur: (n:number)=>string; fmtDate:(s?:string)=>string; }
export function ProductCard({ product: p, fmtCur, fmtDate }: Props) {
  const soldOut = p.stock_quantity === 0;
  const finalPrice = p.price * (1 - p.sale);
  let sd = p.product_details.description;
  if (Array.isArray(sd)) sd = Array.isArray(sd[0]) ? sd[0][0] : sd[0];

  return (
    <Box sx={{ flex: { xs: '1 1 calc(33% - 32px)', md: '1 1 100%' }, minWidth: { xs: 280, md: 'auto' }, maxWidth: { xs: 320, md: '100%' } }}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        <CardMedia component="img" image={p.product_details.image} alt={p.name} sx={{ width: { xs: 'auto' , md: 320 }, height: 180, objectFit: 'cover' }} />
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">{p.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            Catégorie : {p.product_details.category}
          </Typography>
          <Typography variant="body2">
            {fmtDate(p.product_details.date)}{p.product_details.time && ` – ${p.product_details.time}`}
          </Typography>
          {p.product_details.location && (
            <Typography variant="body2" color="text.secondary">
              Lieu : {p.product_details.location}
            </Typography>
          )}
          {sd && <Typography variant="body2">{sd}</Typography>}
          <Typography variant="body2" color="text.secondary">
            {p.product_details.places} place(s)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 , mt: 1 }}>
            {p.sale > 0 && (
              <Typography variant="body2" sx={{ textDecoration: 'line-through' }}>
                {fmtCur(p.price)}
              </Typography>
            )}
            <Typography variant="subtitle1" fontWeight="bold">
              {fmtCur(finalPrice)}
            </Typography>
            {p.sale > 0 && <Chip label={`–${Math.round(p.sale*100)}%`} size="small" />}
          </Box>
          <Typography variant="body2" color={soldOut ? 'error.main' : 'text.secondary'} sx={{ mt:1 }}>
            {soldOut ? 'Épuisé' : `${p.stock_quantity} disponible(s)`}
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small" variant="contained" disabled={soldOut} href={`/tickets/${p.id}`}>
            {soldOut ? 'Épuisé' : 'Acheter'}
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}
