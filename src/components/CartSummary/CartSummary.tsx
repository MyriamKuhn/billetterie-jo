import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatCurrency } from "../../utils/format";
import Button from "@mui/material/Button";
import { Checkbox } from "@mui/material";
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface CartSummaryProps {
  total: number;
  acceptedCGV: boolean;
  onCgvChange: (accepted: boolean) => void;
  onPay: () => void;
  lang: string;
  isMobile: boolean;
}

export function CartSummary({ total, acceptedCGV, onCgvChange, onPay, lang, isMobile }: CartSummaryProps ) {
  const { t } = useTranslation('cart');
  return (
    <Box sx={{ mb:3 }}>
      <Box sx={{ textAlign: 'right', mb: 2 }}>
        <Typography variant="h6">
          {t('table.total_price', { total: formatCurrency(total, lang, 'EUR') })}
        </Typography>
      </Box>
      <Box sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'center' : 'center',
        justifyContent: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 0.5 : 1,
        mb:3
      }}>
        <Button variant="contained" color="primary" disabled={!acceptedCGV} onClick={onPay}>
          {t('checkout.checkout')}
        </Button>
        <Box sx={{ display:'flex', alignItems:'center', gap: isMobile ? 0.5 : -1, mt: isMobile ? 0.5 : 0 }}>
          <Checkbox checked={acceptedCGV} onChange={e => onCgvChange(e.target.checked)} size="small" />
          <Typography variant={isMobile ? 'caption' : 'body2'}>
            {t('checkout.accept_cgv')}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ textAlign: 'right', mt: isMobile ? 6 : 10 }}>
        <Button component={Link} to="/tickets" variant="outlined" size="small">
          {t('checkout.continue_shopping')}
        </Button>
      </Box>
    </Box>
  );
}
