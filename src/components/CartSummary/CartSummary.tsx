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

/**
 * 
 * This component displays the cart total, a checkbox for terms acceptance (CGV), a pay button, and a continue-shopping link.
 * It also handles the state of the CGV acceptance and payment process.
 * 
 */
export function CartSummary({ total, acceptedCGV, onCgvChange, onPay, lang, isMobile, disabled = false }: CartSummaryProps ) {
  const { t } = useTranslation('cart');

  return (
    <Box sx={{ mb:3 }}>
      {/* Display the total price, right-aligned */}
      <Box sx={{ textAlign: 'right', mb: 2 }}>
        <Typography variant="h6">
          {t('table.total_price', { total: formatCurrency(total, lang, 'EUR') })}
        </Typography>
      </Box>

      {/* Checkout button and CGV (terms) acceptance */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        mb:3
      }}>
        {/* Pay button is disabled until CGV accepted or if disabled prop is true */}
        <Button variant="contained" color="primary" disabled={!acceptedCGV || disabled} onClick={onPay}>
          {t('checkout.checkout')}
        </Button>

        {/* CGV acceptance checkbox with link to terms */}
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

        {/* If disabled (e.g., payment in progress), show a warning message */}
        {disabled && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="warning.main">
              {t('cart.payment_in_progress')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* "Continue Shopping" link always enabled, right-aligned */}
      <Box sx={{ textAlign: 'right', mt: isMobile ? 6 : 10 }}>
        <Button component={Link} to="/tickets" variant="outlined" size="small">
          {t('checkout.continue_shopping')}
        </Button>
      </Box>
    </Box>
  );
}
