import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import type { Product } from '../../types/products';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config';
import placeholderImg from '../../assets/products/placeholder.png';

interface Props { 
  product: Product; 
  fmtCur: (n:number)=>string; 
  fmtDate:(s?:string)=>string; 
  onViewDetails: (id: number) => void;
  onBuy: () => void;
}

export function ProductCard({ product: p, fmtCur, fmtDate, onViewDetails, onBuy }: Props) {
  const { t } = useTranslation(['common', 'ticket']);
  const soldOut = p.stock_quantity === 0;
  const finalPrice = p.price * (1 - p.sale);

  return (
    <Box sx={{ flex: { xs: '1 1 calc(33% - 32px)', md: '1 1 100%' }, minWidth: { xs: 280, md: 'auto' }, maxWidth: { xs: 320, md: '100%' } }}>
      <Card sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, p: 2, gap: 1 }}>
        <CardMedia 
          component="img" 
          image={
            p.product_details.image
              ? `${API_BASE_URL}/products/images/${p.product_details.image}`
              : placeholderImg
          } 
          alt={p.name} 
          loading="lazy" 
          sx={{ width: { xs: '100%' , md: 320 }, height: 180, objectFit: 'cover', alignSelf: { xs: 'auto', md: 'center' } }} 
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6">{p.name}</Typography>
          <Typography variant="body2">
            {fmtDate(p.product_details.date)}{p.product_details.time && ` – ${p.product_details.time}`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {p.product_details.location}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('ticket:tickets.places', { count: p.product_details.places })}
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
            { soldOut ? t('ticket:tickets.out_of_stock') : t('ticket:tickets.available', {count: p.stock_quantity}) }
          </Typography>
        </CardContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'row', md: 'column' },
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            '& .MuiButton-root': {
              whiteSpace: 'nowrap'
            }
          }}
        >
          <Button size="small" variant="outlined" onClick={() => onViewDetails(p.id)}>
            {t('ticket:tickets.more_info')}
          </Button>
          <Button size="small" variant="contained" disabled={soldOut} onClick={onBuy}>
            {soldOut ? t('ticket:tickets.out_of_stock') : t('ticket:tickets.buy')}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}