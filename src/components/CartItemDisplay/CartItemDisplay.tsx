import Paper from "@mui/material/Paper";
import type { CartItem } from "../../stores/useCartStore";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { formatCurrency, formatDate } from "../../utils/format";
import QuantityInput from "../QuantityInput";
import { useTranslation } from 'react-i18next';
import TableCell from "@mui/material/TableCell";


interface CartItemDisplayProps {
  item: CartItem;
  lang: string;
  adjustQty: (item: CartItem, newQty: number) => void;
  isMobile: boolean;
}

export function CartItemDisplay({ item, lang, adjustQty, isMobile }: CartItemDisplayProps) {
  const { t } = useTranslation('cart');
  const discountPct = Math.round((item.discountRate ?? 0) * 100)
  if (isMobile) {
    return (
      <Paper key={item.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Nom et badges */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ wordBreak: 'break-word' }}
              gutterBottom
            >
              {item.name}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              <Chip
                label={formatDate(
                  item.date,
                  lang,
                  { day: '2-digit', month: '2-digit', year: 'numeric' }
                )}
                size="small"
              />
              {item.time && <Chip label={item.time} size="small" />}
              <Chip label={item.location} size="small" />
            </Box>
            <Chip
              label={t('cart.remaining', {
                count: item.availableQuantity,
              })}
              size="small"
              color={item.availableQuantity > 0 ? 'success' : 'error'}
            />
          </Box>

          {/* Bloc Prix unitaire, Quantité et Total */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Prix unitaire centré */}
            <Box sx={{ textAlign: 'center' }}>
              {(item.discountRate ?? 0) > 0 ? (
                <Box>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      textDecoration: 'line-through',
                      color: 'text.secondary',
                      mr: 0.5,
                    }}
                  >
                    {formatCurrency(item.originalPrice ?? 0, lang, 'EUR')}
                  </Typography>
                  <Typography
                    variant="body1"
                    component="span"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {formatCurrency(item.price, lang, 'EUR')}
                  </Typography>
                  <Chip 
                    label={`-${discountPct}%`}
                    size="small"
                    color="secondary"
                    sx={{ ml: 1 }}
                  />
                </Box>
              ) : (
                <Typography>{formatCurrency(item.price, lang, 'EUR')}</Typography>
              )}
            </Box>

            {/* Quantité (boutons + TextField) centré */}
            <QuantityInput item={item} adjustQty={adjustQty} />

            {/* Total aligné à droite, avec “Total : ” */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body1">
                {t('table.total_price', {total:formatCurrency(item.quantity * item.price, lang, 'EUR')})}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    );
  }
  return (
    <TableRow
      key={item.id}
      sx={{
        // Si c'est la dernière rangée, on supprime la bordure du bas sur tous les <td>
        '&:last-child td': {
          borderBottom: 'none',
        },
      }}
    >
      {/* Colonne “Produit” */}
      <TableCell sx={{ minWidth: 200 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="subtitle1"
              component="div"
              sx={{ wordBreak: 'break-word' }}
            >
              {item.name}
            </Typography>
            <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                label={formatDate(
                  item.date,
                  lang,
                  { day: '2-digit', month: '2-digit', year: 'numeric' }
                )}
                size="small"
              />
              {item.time && <Chip label={item.time} size="small" />}
              <Chip label={item.location} size="small" />
            </Box>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={t('cart.remaining', {
                  count: item.availableQuantity,
                })}
                size="small"
                color={item.availableQuantity > 0 ? 'success' : 'error'}
              />
            </Box>
          </Box>
        </Box>
      </TableCell>

      {/* Colonne “Prix unitaire” */}
      <TableCell align="right" sx={{ minWidth: 120 }}>
        {(item.discountRate ?? 0) > 0 ? (
          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant="body2"
              component="span"
              sx={{ textDecoration: 'line-through', color: 'text.secondary', mr: 0.5 }}
            >
              {formatCurrency(item.originalPrice ?? 0, lang, 'EUR')}
            </Typography>
            <Typography
              variant="body1"
              component="span"
              sx={{ fontWeight: 'bold' }}
            >
              {formatCurrency(item.price, lang, 'EUR')}
            </Typography>
            <Chip 
              label={`-${discountPct}%`}
              size="small"
              color="secondary"
              sx={{ ml: 1 }}
            />
          </Box>
        ) : (
          <Typography>{formatCurrency(item.price, lang, 'EUR')}</Typography>
        )}
      </TableCell>

      {/* Colonne “Quantité” (boutons + TextField) */}
      <TableCell align="center" sx={{ minWidth: 160 }}>
        <QuantityInput item={item} adjustQty={adjustQty} />
      </TableCell>

      {/* Colonne “Total” */}
      <TableCell align="right" sx={{ minWidth: 120 }}>
        <Typography variant="body1">
          {formatCurrency(item.quantity * item.price, lang, 'EUR')}
        </Typography>
      </TableCell>
    </TableRow>
  );
}
