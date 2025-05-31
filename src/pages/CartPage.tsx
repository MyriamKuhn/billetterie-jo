import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import useMediaQuery from '@mui/material/useMediaQuery';
import OlympicLoader from '../components/OlympicLoader';
import QuantityInput from '../components/QuantityInput';
import Seo from '../components/Seo';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useLanguageStore } from '../stores/useLanguageStore';
import { useCartStore, type CartItem } from '../stores/cartStore';
import { useReloadCart } from '../hooks/useReloadCart';
import { useCustomSnackbar } from '../hooks/useCustomSnackbar';
import { formatCurrency } from '../utils/format';
import { ErrorDisplay } from '../components/ErrorDisplay';

export default function CartPage() {
  const { t } = useTranslation(['cart', 'common']);
  const lang = useLanguageStore((s) => s.lang);

  // ── Hooks / Store / Snackbar ─────────────────────────────────────────────
  const { loading, hasError, reload } = useReloadCart();
  const items = useCartStore((s) => s.items) ?? [];
  const addItem = useCartStore.getState().addItem;
  const { notify } = useCustomSnackbar();

  // CGV
  const [acceptedCGV, setAcceptedCGV] = useState(false);

  // Calcul du total global
  const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  // Recharger le panier au montage et quand la langue change
  useEffect(() => {
    reload();
  }, [reload, lang]);

  // Pour détecter l’écran « mobile » (< 600px)
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Ajustement de la quantité d’un article
  const adjustQty = useCallback(
    async (item: CartItem, newQty: number) => {
      if (newQty < 0) newQty = 0;
      if (newQty > item.availableQuantity) {
        notify(t('cart:not_enough_stock', { count: item.availableQuantity }), 'warning');
        return;
      }
      try {
        await addItem(item.id, newQty, item.availableQuantity);
        if (newQty > item.quantity) {
          notify(t('cart:add_success'), 'success');
        } else if (newQty < item.quantity) {
          notify(t('cart:remove_success'), 'success');
        } else {
          notify(t('cart:update_success'), 'info');
        }
      } catch {
        notify(t('cart:error_update'), 'error');
      }
    },
    [addItem, notify, t]
  );

  // Clic “Payer”
  const handlePay = () => {
    notify(t('cart:checkout_not_implemented'), 'info');
  };

  // ── ÉTAT DE CHARGEMENT / ERREUR / PANIER VIDE ────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <OlympicLoader />
      </Box>
    );
  }

  if (hasError) {
    return (
      <ErrorDisplay
        title={t('cart:error_loading')}
        message={t('cart:error_loading_message')} 
        showRetry={true}
        retryButtonText={t('common:retry')}
        onRetry={reload}
        showHome={true}
        homeButtonText={t('common:go_home')}
      />
    );
  }

  if (items.length === 0) {
    return (
      <ErrorDisplay
        title={t('cart:empty')}               
        message={t('cart:empty_message')}     
        showRetry={false}                     
        showHome={true}                       
        homeButtonText={t('common:go_home')}  
      />
    );
  }

  // ── RENDER DES ÉLÉMENTS ──────────────────────────────────────────────────────

  // 1) Version “Table” (desktop / tablette)
  const renderTable = () => (
    <TableContainer
      component={Paper}
      sx={{
        mb: 3,
        overflowX: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('cart:table.product')}</TableCell>
            <TableCell align="right">{t('cart:table.unit_price')}</TableCell>
            <TableCell align="center">{t('cart:table.quantity')}</TableCell>
            <TableCell align="right">{t('cart:table.total')}</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {items.map((item) => (
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
                        label={new Date(item.date).toLocaleDateString(lang, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                        size="small"
                      />
                      {item.time && <Chip label={item.time} size="small" />}
                      <Chip label={item.location} size="small" />
                    </Box>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={t('cart:places_remaining', {
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
                {item.discountRate !== null && item.originalPrice !== null ? (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ textDecoration: 'line-through', color: 'text.secondary', mr: 0.5 }}
                    >
                      {formatCurrency(item.originalPrice, lang, 'EUR')}
                    </Typography>
                    <Typography
                      variant="body1"
                      component="span"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {formatCurrency(item.price, lang, 'EUR')}
                    </Typography>
                    <Chip
                      label={`-${Math.round(item.discountRate * 100)}%`}
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );


  // 2) Version “Carte” (mobile)
  const renderCards = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
      {items.map((item) => (
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
                  label={new Date(item.date).toLocaleDateString(lang, {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                  size="small"
                />
                {item.time && <Chip label={item.time} size="small" />}
                <Chip label={item.location} size="small" />
              </Box>
              <Chip
                label={t('cart:places_remaining', {
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
                {item.discountRate !== null && item.originalPrice !== null ? (
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
                      {formatCurrency(item.originalPrice, lang, 'EUR')}
                    </Typography>
                    <Typography
                      variant="body1"
                      component="span"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {formatCurrency(item.price, lang, 'EUR')}
                    </Typography>
                    <Chip
                      label={`-${Math.round(item.discountRate * 100)}%`}
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
                  {t('cart:total_label', 'Total')}: {formatCurrency(item.quantity * item.price, lang, 'EUR')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );

  // 3) Zone résumé & CTA (responsive)
  const renderSummary = () => {
    if (isMobile) {
      return (
        <Box sx={{ mb: 3 }}>
          {/* Total du panier aligné à droite (mobile) */}
          <Box sx={{ textAlign: 'right', mb: 2 }}>
            <Typography variant="h6">
              {t('cart:total')}: {formatCurrency(total, lang, 'EUR')}
            </Typography>
          </Box>

          {/* Bloc “Payer” + Checkbox CGV (mobile) */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              mb: 3,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              disabled={!acceptedCGV}
              onClick={handlePay}
            >
              {t('cart:checkout')}
            </Button>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.5,
              }}
            >
              <Checkbox
                checked={acceptedCGV}
                onChange={(e) => setAcceptedCGV(e.target.checked)}
                size="small"
                sx={{
                  padding: 0,
                  margin: 0,
                }}
              />
              <Typography variant="caption" sx={{ lineHeight: 1 }}>
                {t('cart:accept_cgv')}
              </Typography>
            </Box>
          </Box>

          {/* Bouton “Continuer vos achats” aligné à droite (mobile) */}
          <Box sx={{ textAlign: 'right', mt: 6 }}>
            <Button component={Link} to="/tickets" variant="outlined" size="small">
              {t('common:continue_shopping')}
            </Button>
          </Box>
        </Box>
      );
    } else {
      // ── Desktop/Tablette ─────────────────────────────────────────────────
      return (
        <Box sx={{ mb: 3 }}>
          {/* Total du panier aligné à droite, juste sous la table */}
          <Box sx={{ textAlign: 'right', mb: 2 }}>
            <Typography variant="h6">
              {t('cart:total')}: {formatCurrency(total, lang, 'EUR')}
            </Typography>
          </Box>

          {/* Bloc “Payer” + Checkbox CGV sur la même ligne, centrés */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1,
              mb: 3,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              disabled={!acceptedCGV}
              onClick={handlePay}
            >
              {t('cart:checkout')}
            </Button>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: -1,
              }}
            >
              <Checkbox
                checked={acceptedCGV}
                onChange={(e) => setAcceptedCGV(e.target.checked)}
                size="small"
              />
              <Typography variant="body2">
                {t('cart:accept_cgv')}
              </Typography>
            </Box>
          </Box>

          {/* Bouton “Continuer vos achats” aligné à droite, avec marge supérieure accrue */}
          <Box sx={{ textAlign: 'right', mt: 10 }}>
            <Button component={Link} to="/tickets" variant="outlined" size="small">
              {t('common:continue_shopping')}
            </Button>
          </Box>
        </Box>
      );
    }
  };

  return (
    <>
      <Seo title={t('cart:seo.title')} description={t('cart:seo.description')} />
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" gutterBottom>
          {t('cart:title')}
        </Typography>

        {isMobile ? renderCards() : renderTable()}

        {renderSummary()}
      </Box>
    </>
  );
}
