import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import QrCodeIcon from '@mui/icons-material/QrCode'
import DownloadIcon from '@mui/icons-material/FileDownload'
import ReceiptIcon from '@mui/icons-material/Receipt'
import type { Ticket, TicketStatus } from '../../types/tickets'
import { useDownloadTicket } from '../../hooks/useDownloadTicket'
import { useFetchTicketQr } from '../../hooks/useFetchTicketQr'
import { useDownloadInvoice } from '../../hooks/useDownloadInvoice'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../utils/format'
import { useLanguageStore } from '../../stores/useLanguageStore'
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar'
import Chip from '@mui/material/Chip'
import { useProductDetails } from '../../hooks/useProductDetails'
import { useEffect } from 'react'
import { logError } from '../../utils/logger'
import Skeleton from '@mui/material/Skeleton';
import { useInView } from 'react-intersection-observer';
import { TicketCardSkeleton } from '../TicketCardSkeleton';

interface TicketCardProps {
  ticket: Ticket
  invoiceLink: string 
}

// Mapping du statut Ticket → couleur Chip MUI
function getTicketStatusChipColor(status: TicketStatus): 'success' | 'warning' | 'error' | 'default' | 'info' {
  switch (status) {
    case 'used':
      return 'success';
    case 'issued':
      return 'info';
    case 'refunded':
      return 'warning';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

export function TicketCard({ ticket }: TicketCardProps) {
  const { t } = useTranslation('tickets')
  const lang = useLanguageStore(s => s.lang)
  const { notify } = useCustomSnackbar()

  // Hooks de download
  const { download: downloadTicket, downloading: downloadingTicket } = useDownloadTicket();
  const { download: downloadInvoice, downloading: downloadingInvoice } = useDownloadInvoice();

  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' });
  // Récupération du QR
  const { qrUrl, loading: loadingQr } = useFetchTicketQr(inView ? ticket.qr_filename : null);
  // Récupérer l'ID du produit depuis le snapshot
  const productId = ticket.product_snapshot?.product_id ?? null;
  // Hook pour détails produit
  const { product, loading: loadingProduct, error: productError } = useProductDetails(productId, lang);

  // Effet pour ne logger/qu’er notifier l’erreur que si on a quitté l’état loading ET qu’on a bien une erreur
  useEffect(() => {
    if (!loadingProduct && productError) {
      logError('Error by retrieving product details for the ticket', productError);
      notify(t('errors.product_fetch_failed'), 'warning');
    }
  }, [loadingProduct, productError, ticket.id, notify, t]);

  // 1) Si on est en train de charger le produit, on affiche skeleton complet
  if (loadingProduct) {
    return <TicketCardSkeleton />;
  }

  // 2) Si échec de fetch produit, on affiche fallback minimal (pas skeleton complet)
  let nameToShow = '';
  let dateStr = '';
  let timeStr = '';
  let locationToShow = '';
  let placesToShow: number | null = null;

  if (productError || !product) {
    nameToShow = t('tickets.no_product');
  } else {
    // product disponible
    nameToShow = ticket.product_snapshot?.product_name;
    dateStr = formatDate(product!.product_details?.date, lang);
    timeStr = product!.product_details?.time || '';
    locationToShow = product!.product_details?.location || t('tickets.no_location');
    placesToShow = ticket.product_snapshot?.ticket_places ?? null;
  };

  // Statut du ticket
  const statusLabel = t(`tickets.status.${ticket.status}`, ticket.status);
  const chipColor = getTicketStatusChipColor(ticket.status);

  // Handler téléchargement billet
  const handleDownloadTicket = () => {
    if (ticket.pdf_filename) {
      downloadTicket(ticket.pdf_filename)
        .catch(_err => {
          notify(t('errors.download_error'), 'error');
        });
    } else {
      notify(t('tickets.no_pdf'), 'warning');
    }
  };

  // Handler téléchargement facture
  const handleDownloadInvoice = () => {
    const link = `invoice_${ticket.payment_uuid}.pdf`;
    downloadInvoice(link).catch(_err => {
      notify(t('errors.invoice_download_error'), 'error');
    });
  };

  // Zone QR code : si loadingQr, skeleton partiel ; sinon image ou icône
  const qrMedia = loadingQr ? (
    <Skeleton
      variant="rectangular"
      sx={{
        width: { xs: '100%', md: 200 },
        height: { xs: 150, md: 200 },
      }}
    />
  ) : qrUrl ? (
    <CardMedia
      component="img"
      image={qrUrl}
      alt={t('tickets.qr_alt')}
      loading="lazy"
      sx={{
        width: { xs: '100%', md: 200 },
        height: { xs: 150, md: 200 },
        objectFit: 'contain',
        backgroundColor: 'background.default',
      }}
    />
  ) : (
    <Box
      sx={{
        width: { xs: '100%', md: 200 },
        height: { xs: 150, md: 200 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <QrCodeIcon fontSize="large" color="disabled" />
    </Box>
  );

  return (
    <Box ref={ref} sx={{ flex: { xs: '1 1 calc(33% - 32px)', md: '1 1 100%' }, minWidth: { xs: 280, md: 'auto' }, maxWidth: { xs: 320, md: '100%' } }}>
      <Card
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          p: 2,
          gap: 1,
        }}
      >
        {/* Zone QR code (CardMedia ou placeholder) */}
        {qrMedia}

        {/* Contenu principal */}
        <CardContent sx={{ flexGrow: 1 }}>
          {/* Nom / événement */}
          <Typography variant="h6" gutterBottom>
            {nameToShow}
          </Typography>

          {/* Token */}
          {!loadingProduct && ticket.token && (
            <Typography variant="body2" sx={{ mb: 3 }}>
              {t('tickets.token')}: {ticket.token}
            </Typography>
          )}

          {/* Date / lieu / places */}
          {!loadingProduct && dateStr && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {dateStr}{timeStr && ` – ${timeStr}`}
            </Typography>
          )}
          {!loadingProduct && locationToShow && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
              {locationToShow}
            </Typography>
          )}
          {!loadingProduct && placesToShow !== null && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {t('tickets.places', { count: placesToShow })}
            </Typography>
          )}

          {/* Chip statut */}
          {!loadingProduct && (
            <Box sx={{ mt: 1 }}>
              <Chip label={statusLabel} color={chipColor} size="small" />
            </Box>
          )}
        </CardContent>

        {/* Actions : téléchargement billets et facture */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            '& .MuiButton-root': {
              whiteSpace: 'nowrap',
            },
          }}
        >
          {/* Télécharger billet PDF */}
          <Tooltip title={t('tickets.download_pdf')}>
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={downloadingTicket ? <CircularProgress size={16} /> : <DownloadIcon />}
                onClick={handleDownloadTicket}
                disabled={downloadingTicket}
              >
                {t('tickets.download_ticket')}
              </Button>
            </span>
          </Tooltip>

          {/* Télécharger facture si disponible */}
          <Tooltip title={ticket.product_snapshot.discounted_price === 0 ? t('tickets.free_ticket') : t('tickets.download_invoice_pdf')}>
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={downloadingInvoice ? <CircularProgress size={16} /> : <ReceiptIcon />}
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice || ticket.product_snapshot.discounted_price === 0}
              >
                {ticket.product_snapshot.discounted_price === 0 ? t('tickets.free_ticket') : t('tickets.download_invoice')}
              </Button>
            </span>
          </Tooltip>

        </Box>
      </Card>
    </Box>
  );
}