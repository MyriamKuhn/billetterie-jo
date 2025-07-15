import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { useTranslation } from 'react-i18next'
import { formatDate, formatCurrency } from '../../utils/format'
import type { Invoice } from '../../types/invoices'
import { useLanguageStore } from '../../stores/useLanguageStore'
import ReceiptIcon from '@mui/icons-material/Receipt'
import { useDownloadInvoice } from '../../hooks/useDownloadInvoice'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar'

// Map invoice status to MUI Chip colors
export function getStatusChipColor(status: Invoice['status']): 'success' | 'warning' | 'error' | 'default' | 'info' {
  switch (status) {
    case 'paid':
      return 'success'
    case 'pending':
      return 'warning'
    case 'failed':
      return 'error'
    case 'refunded':
      return 'info'
    default:
      return 'default'
  }
}

interface InvoiceCardProps {
  invoice: Invoice
}

/**
 * Displays an invoice summary card with download icon, date, amount, status chip, and download handling.
 * This component is responsive and adapts to different screen sizes.
 */
export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const { t } = useTranslation('invoices')
  const lang = useLanguageStore(s => s.lang)

  // Download hook and snackbars
  const { download, downloading } = useDownloadInvoice()
  const { notify } = useCustomSnackbar()
  
  // Format date and amount strings
  const dateStr = formatDate(invoice.created_at, lang)
  const amountStr = formatCurrency(invoice.amount, lang, 'EUR')

  // Determine status label (special case for free ticket)
  let statusLabel;
  if (invoice.status === 'paid' && invoice.amount === 0) {
    statusLabel = t('card.free_ticket')
  } else {
    statusLabel = t(`card.status.${invoice.status}`)
  }
  const chipColor = getStatusChipColor(invoice.status)

  // Can download only if paid or refunded
  const canDownload = invoice.status === 'paid' || invoice.status === 'refunded'

  // Tooltip text varies by status
  let downloadTooltip = t('card.download_invoice')
  if (!canDownload) {
    if (invoice.status === 'pending') {
      downloadTooltip = t('card.download_not_ready')
    } else if (invoice.status === 'failed') {
      downloadTooltip = t('card.download_not_available')
    } else {
      downloadTooltip = t('card.download_not_available_generic')
    }
  }

  // Handle click on icon: either trigger download or show snackbar
  const handleIconClick = () => {
    if (canDownload) {
      download(invoice.invoice_link)
    } else {
      // Show context-specific message
      if (invoice.status === 'pending') {
        notify(t('snackbar.pending_message'), 'warning')
      } else if (invoice.status === 'failed') {
        notify(t('snackbar.failed_message'), 'error')
      } else {
        notify(t('snackbar.unavailable_message'), 'info')
      }
    }
  }

  return (
    <>
      <Box
        sx={{
          flex: { xs: '1 1 calc(33% - 32px)', md: '1 1 100%' },
          minWidth: { xs: 280, md: 'auto' },
          maxWidth: { xs: 320, md: '100%' },
        }}
      >
        <Card
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            p: 2,
            gap: 1,
          }}
        >
          {/* Icon area with tooltip and download spinner */}
          <Tooltip title={downloadTooltip}>
            <Box
              onClick={handleIconClick}
              sx={{
                cursor: canDownload ? 'pointer' : 'default',
                width: { xs: '100%', md: 120 },
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                borderRadius: 1,
                position: 'relative',
                '&:hover': canDownload ? { bgcolor: 'action.hover' } : {},
              }}
            >
              {downloading && canDownload
                ? <CircularProgress size={24} />
                : <ReceiptIcon fontSize="large" color={canDownload ? 'action' : 'disabled'} />
              }
            </Box>
          </Tooltip>

          {/* Invoice details */}
          <CardContent sx={{ flexGrow: 1 }}>
            {/* Invoice reference/UUID */}
            <Typography variant="h6">
              {t('card.reference', { reference: invoice.uuid })}
            </Typography>
            {/* Creation date */}
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {t('card.date', { date: dateStr })}
            </Typography>
            {/* Amount */}
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {t('card.amount', { amount: amountStr })}
            </Typography>
            {/* Status chip */}
            <Box sx={{ mt: 1 }}>
              <Chip
                label={statusLabel}
                color={chipColor}
                size="small"
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  )
}