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

/**
 * Map a ticket status to an MUI Chip color.
 */
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

/**
 * Displays an individual ticket card with lazy-loaded QR code, product details, status chip, and download actions for the ticket PDF and invoice. 
 */
export function TicketCard({ ticket }: TicketCardProps) {
  const { t } = useTranslation('tickets')
  const lang = useLanguageStore(s => s.lang)
  const { notify } = useCustomSnackbar()

  // Prepare download hooks for ticket PDF & invoice
  const { download: downloadTicket, downloading: downloadingTicket } = useDownloadTicket();
  const { download: downloadInvoice, downloading: downloadingInvoice } = useDownloadInvoice();

  // Lazy-load QR code when the card scrolls into view
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' });
  const { qrUrl, loading: loadingQr } = useFetchTicketQr(inView ? ticket.qr_filename : null);
  
  // Fetch product snapshot details
  const productId = ticket.product_snapshot?.product_id ?? null;
  const { product, loading: loadingProduct, error: productError } = useProductDetails(productId, lang);

  // Notify/log if fetching product details fails (after loading completes)
  useEffect(() => {
    if (!loadingProduct && productError) {
      logError('Error by retrieving product details for the ticket', productError);
      notify(t('errors.product_fetch_failed'), 'warning');
    }
  }, [loadingProduct, productError, ticket.id, notify, t]);

  // While product is loading, show full-card skeleton
  if (loadingProduct) {
    return <TicketCardSkeleton />;
  }

  // Prepare display values once product load either succeeds or fails
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

  // Prepare status chip
  const statusLabel = t(`tickets.status.${ticket.status}`, ticket.status);
  const chipColor = getTicketStatusChipColor(ticket.status);

  // Handler to download ticket PDF
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

  // Handler to download invoice PDF
  const handleDownloadInvoice = () => {
    const link = `invoice_${ticket.payment_uuid}.pdf`;
    downloadInvoice(link).catch(_err => {
      notify(t('errors.invoice_download_error'), 'error');
    });
  };

  // QR code rendering: skeleton while loading, image if ready, fallback icon otherwise
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
        {/* QR code area */}
        {qrMedia}

        {/* Main content */}
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            {nameToShow}
          </Typography>

          {!loadingProduct && ticket.token && (
            <Typography variant="body2" sx={{ mb: 3 }}>
              {t('tickets.token', { token: ticket.token })}
            </Typography>
          )}

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

          {!loadingProduct && (
            <Box sx={{ mt: 1 }}>
              <Chip label={statusLabel} color={chipColor} size="small" />
            </Box>
          )}
        </CardContent>

        {/* Action buttons */}
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