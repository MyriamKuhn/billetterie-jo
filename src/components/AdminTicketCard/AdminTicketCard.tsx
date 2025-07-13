import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'

import QrCodeIcon from '@mui/icons-material/QrCode'
import DownloadIcon from '@mui/icons-material/FileDownload'
import ReceiptIcon from '@mui/icons-material/Receipt'

import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'

import { useLanguageStore } from '../../stores/useLanguageStore'
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar'
import { useProductDetails } from '../../hooks/useProductDetails'
import { useAdminDownloadTicket } from '../../hooks/useAdminDownloadTicket'
import { useAdminDownloadInvoice } from '../../hooks/useAdminDownloadInvoice'
import { useAdminFetchTicketQr } from '../../hooks/useAdminFetchTicketQr'
import { TicketCardSkeleton } from '../TicketCardSkeleton'
import { FilterSelect } from '../FilterSelect'

import type { AdminTicket } from '../../types/admin'
import type { TicketStatus } from '../../types/tickets'
import type { InvoiceStatus } from '../../types/invoices'
import { formatCurrency, formatDate } from '../../utils/format'
import { logError } from '../../utils/logger'

// Helper to map invoice status to MUI Chip color
const getPaymentStatusChipColor = (status: InvoiceStatus): 'success' | 'info' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'paid': return 'success'
    case 'pending': return 'info'
    case 'refunded': return 'warning'
    case 'failed': return 'error'
    default: return 'default'
  }
}

interface TicketCardProps {
  ticket: AdminTicket
  onSave: (id: number, update: { status: TicketStatus }) => Promise<boolean>
  onRefresh: () => void
}

export function AdminTicketCard({ ticket, onSave, onRefresh }: TicketCardProps) {
  const { t } = useTranslation('orders')
  const lang = useLanguageStore(s => s.lang)
  const { notify } = useCustomSnackbar()

  // Download hooks
  const { download: downloadTicket, downloading: ticketLoading } = useAdminDownloadTicket()
  const { download: downloadInvoice, downloading: invoiceLoading } = useAdminDownloadInvoice()

  // QR fetch when in view
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' })
  const { qrUrl, loading: qrLoading } = useAdminFetchTicketQr(inView ? ticket.qr_filename : null)

  // Product details
  const productId = ticket.product_snapshot?.product_id ?? 0
  const { product, loading: prodLoading, error: prodError } = useProductDetails(productId, lang)

  useEffect(() => {
    if (!prodLoading && prodError) {
      logError('Failed fetching product details', prodError)
      notify(t('errors.product_fetch_failed'), 'warning')
    }
  }, [prodLoading, prodError, notify, t])

  // Define status map with explicit typing so TS knows it can be indexed by TicketStatus
  const statusMap: Partial<Record<TicketStatus, string>> = {
    issued: t('filters.status_issued'),
    used: t('filters.status_used'),
    refunded: t('filters.status_refunded'),
    cancelled: t('filters.status_cancelled')
  }

  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(ticket.status)
  const [selectedLabel, setSelectedLabel] = useState<string>(statusMap[ticket.status] ?? '')
  const isDirty = useMemo(() => selectedStatus !== ticket.status, [selectedStatus, ticket.status])
  const labelToStatus = Object.fromEntries(
    Object.entries(statusMap).map(([code, label]) => [label, code])
  ) as Record<string, TicketStatus>

  const [saving, setSaving] = useState(false)
  
  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await onSave(ticket.id, { status: selectedStatus })
      if (success) {
        notify(t('orders.save_success'), 'success')
        onRefresh()
      } else throw new Error()
    } catch {
      notify(t('errors.save_error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    if (ticket.pdf_filename) downloadTicket(ticket.pdf_filename).catch(() => notify(t('errors.download_error'), 'error'))
    else notify(t('errors.no_pdf'), 'warning')
  }

  const handleInvoice = () => {
    const file = `invoice_${ticket.payment.uuid}.pdf`
    downloadInvoice(file).catch(() => notify(t('errors.invoice_download_error'), 'error'))
  }

  if (prodLoading) return <TicketCardSkeleton />

  // Snapshot and user fallback
  const snap = ticket.product_snapshot
  const user = ticket.user

  const title = prodError || !product
    ? t('orders.no_product')
    : `${snap?.product_name} (${ticket.token})`

  const date = product?.product_details?.date
    ? formatDate(product.product_details.date, lang)
    : ''
  const time = product?.product_details?.time ?? ''
  const location = product?.product_details?.location ?? t('orders.no_location')

  return (
    <Card ref={ref} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, p: 2 }}>
      {/* QR Section */}
      <Box sx={{ minWidth: { md: 200 }, textAlign: 'center' }}>
        {qrLoading
          ? <Skeleton variant="rectangular" width={200} height={200} />
          : qrUrl
            ? <CardMedia component="img" image={qrUrl} alt={t('orders.qr_alt')} sx={{ width: 200, height: 200, objectFit: 'contain' }} />
            : <Box sx={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                <QrCodeIcon fontSize="large" color="disabled" />
              </Box>
        }
      </Box>

      {/* Main Content */}
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header with ID and Payment Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">
            {t('orders.ticket_id', { id: ticket.id })}
          </Typography>
          {ticket.payment.status === 'paid' && snap?.discounted_price === 0 ? (
            <Chip label={t('orders.free_ticket')} color={getPaymentStatusChipColor(ticket.payment.status)} size="small" sx={{ ml: 1 }} />
          ) : (
            <Chip label={t(`invoices.status.${ticket.payment.status}`)} color={getPaymentStatusChipColor(ticket.payment.status)} size="small" sx={{ ml: 1 }} />
          )}
        </Box>

        {/* Event Info */}
        <Typography variant="subtitle1" gutterBottom>{title}</Typography>
        {date && <Typography variant="body2" color="text.secondary">{date}{time && ` – ${time}`}</Typography>}
        <Typography variant="body2" color="text.secondary" gutterBottom>{location}</Typography>

        {/* Pricing & User */}
        <Typography variant="body1" sx={{ mt: 1 }}>
          {t('orders.price_paid', { price: formatCurrency(snap?.discounted_price, lang) })}
        </Typography>
        {user && (
          <Typography variant="body1">
            {t('orders.user_info', { id: user.id, name: `${user.firstname} ${user.lastname}`, email: user.email })}
          </Typography>
        )}

        {/* Dates */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {t('orders.created_at', { date: formatDate(ticket.created_at!, lang) })}
          {ticket.used_at && ` – ${t('orders.used_at', { date: formatDate(ticket.used_at, lang) })}`}
          {ticket.refunded_at && ` – ${t('orders.refunded_at', { date: formatDate(ticket.refunded_at, lang) })}`}
          {ticket.cancelled_at && ` – ${t('orders.cancelled_at', { date: formatDate(ticket.cancelled_at, lang) })}`}
        </Typography>

        {/* Actions */}
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Tooltip title={t('orders.download_pdf')}>
            <span>
              <Button size="small" variant="outlined" startIcon={ticketLoading ? <CircularProgress size={16} /> : <DownloadIcon />} onClick={handleDownload} disabled={ticketLoading}>
                {t('orders.download_ticket')}
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={snap?.discounted_price === 0 ? t('orders.free_ticket') : t('orders.download_invoice_pdf')}>
            <span>
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={invoiceLoading ? <CircularProgress size={16} /> : <ReceiptIcon />} 
                onClick={handleInvoice} 
                disabled={invoiceLoading || snap?.discounted_price === 0}>
                {snap?.discounted_price === 0 ? t('orders.free_ticket') : t('orders.download_invoice')}
              </Button>
            </span>
          </Tooltip>

          {/* FilterSelect wrapped in Box for layout */}
          <Box sx={{ ml: 'auto' }}>
            <FilterSelect<string>
              label={t('filters.status_label')}
              value={selectedLabel}
              options={Object.values(statusMap)}
              onChange={label => { setSelectedLabel(label); setSelectedStatus(labelToStatus[label]) }}
            />
          </Box>
          <Button variant="contained" size="small" onClick={handleSave} disabled={saving || !isDirty} startIcon={saving ? <CircularProgress color="inherit" size={16} /> : undefined}>
            {saving ? t('orders.saving') : t('orders.save')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

