import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatCurrency } from "../../utils/format";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import MuiLink from "@mui/material/Link";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";

interface CartSummaryProps {
  total: number;
  acceptedCGV: boolean;
  onCgvChange: (accepted: boolean) => void;
  onPay: () => void;
  lang: string;
  isMobile: boolean;
  disabled?: boolean;
}

export function CartSummary({ total, acceptedCGV, onCgvChange, onPay, lang, isMobile, disabled = false }: CartSummaryProps ) {
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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        mb:3
      }}>
        <Button variant="contained" color="primary" disabled={!acceptedCGV || disabled} onClick={onPay}>
          {t('checkout.checkout')}
        </Button>
        <Box sx={{ display:'flex', alignItems:'center', gap: 0, mt: 0 }}>
          <Checkbox checked={acceptedCGV} onChange={e => onCgvChange(e.target.checked)} disabled={disabled} size="small" />
          <Typography variant={isMobile ? 'caption' : 'body2'}>
            {t('checkout.accept_cgv_prefix')}{' '}
            <MuiLink
                sx={{ m: 0 }}
                component={Link}
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
            >
                {isMobile ? t('checkout.accept_cgv_link_text_mobile') : t('checkout.accept_cgv_link_text')}
              </MuiLink>
          </Typography>
        </Box>

        {/* Si disabled, on peut afficher un petit message d'info */}
        {disabled && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="warning.main">
              {t('cart.payment_in_progress')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Bouton “Continuer shopping” toujours actif */}
      <Box sx={{ textAlign: 'right', mt: isMobile ? 6 : 10 }}>
        <Button component={Link} to="/tickets" variant="outlined" size="small">
          {t('checkout.continue_shopping')}
        </Button>
      </Box>
    </Box>
  );
}
