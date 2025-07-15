import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { useTranslation } from 'react-i18next'
import { formatDate, formatTime, formatCurrency } from '../../utils/format'
import { useLanguageStore } from '../../stores/useLanguageStore'
import ReceiptIcon from '@mui/icons-material/Receipt'
import { useAdminDownloadInvoice } from '../../hooks/useAdminDownloadInvoice'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar'
import type { AdminPayments, AdminPaymentsStatus } from '../../types/admin'
import { useState } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { CardActions, Divider } from '@mui/material'

/**
 * Map payment status to a MUI Chip color.
 */
export const getPaymentStatusChipColor = (status: AdminPaymentsStatus): 'success' | 'info' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'paid': return 'success'
    case 'pending': return 'info'
    case 'refunded': return 'warning'
    case 'failed': return 'error'
    default: return 'default'
  }
}

interface PaymentCardProps {
  payment: AdminPayments
  onSave: (uuid: string, refund: { amount: number }) => Promise<boolean>;
  onRefresh: () => void;
}

/**
 * Displays a single payment entry with download and refund functionality.
 *
 * - Shows invoice download icon or spinner when downloading.
 * - Formats dates, amounts, and client/cart info.
 * - Allows issuing a partial refund when applicable.
 */
export function AdminPaymentCard({ payment, onSave, onRefresh }: PaymentCardProps) {
  const { t } = useTranslation('payments')
  const lang = useLanguageStore(s => s.lang)

  const { download, downloading } = useAdminDownloadInvoice()
  const { notify } = useCustomSnackbar()

  const [refundAmount, setRefundAmount] = useState<string>('')
  const [refunding, setRefunding]   = useState<boolean>(false)

  // Determine display label for status or free ticket
  let statusLabel;
  if (payment.payment_method === 'free') {
    statusLabel = t('payments.free_ticket')
  } else {
    statusLabel = t(`payments.status.${payment.status}`)
  }
  const chipColor = getPaymentStatusChipColor(payment.status)

  // Only allow invoice download when paid or already refunded
  const canDownload = payment.status === 'paid' || payment.status === 'refunded'

  // Tooltip text adapts based on download eligibility
  let downloadTooltip = t('payments.download_invoice')
  if (!canDownload) {
    if (payment.status === 'pending') {
      downloadTooltip = t('payments.download_not_ready')
    } else if (payment.status === 'failed') {
      downloadTooltip = t('payments.download_not_available')
    } else {
      downloadTooltip = t('payments.download_not_available_generic')
    }
  }

  /**
   * Handle click on the receipt icon:
   * - If allowed, trigger invoice download.
   * - Otherwise, show appropriate snackbar message.
   */
  const handleIconClick = () => {
    if (canDownload) {
      download(payment.invoice_link)
    } else {
      if (payment.status === 'pending') {
        notify(t('snackbar.pending_message'), 'warning')
      } else if (payment.status === 'failed') {
        notify(t('snackbar.failed_message'), 'error')
      } else {
        notify(t('snackbar.unavailable_message'), 'info')
      }
    }
  }

  /**
   * Issue a refund of the entered amount.
   * Calls onSave, then notifies and refreshes on success.
   */
  const handleRefund = async () => {
    const amount = parseFloat(refundAmount)
    setRefunding(true)
    try {
      const success = await onSave(payment.uuid, { amount })
      if (success) {
        notify(t('payments.refund_success'), 'success')
        onRefresh()
        setRefundAmount('')
      } else {
        throw new Error()
      }
    } catch {
      notify(t('payments.refund_error'), 'error')
    } finally {
      setRefunding(false)
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
          {/* Invoice download area */}
          <Tooltip title={downloadTooltip}>
            <Box
              onClick={handleIconClick}
              sx={{
                cursor: canDownload ? 'pointer' : 'default',
                width: { xs: '100%', md: 120 },
                minWidth: 120,
                height: 80,
                minHeight: 80,
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

          <CardContent sx={{ flexGrow: 1 }}>
            {/* Reference and status */}
            <Typography variant="h6">
              {t('payments.reference')}: {payment.uuid}
            </Typography>
            <Chip
              label={statusLabel}
              color={chipColor}
              size="small"
            />
            {/* Display appropriate date section */}
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              { payment.payment_method === 'free' || payment.status === 'pending' || payment.status === 'failed'
                ? t('payments.created_at', { date: formatDate(payment.created_at, lang), time: formatTime(payment.created_at, lang) })
                : payment.status === 'refunded'
                  ? t('payments.refunded_at', { date: formatDate(payment.refunded_at!, lang), time: formatTime(payment.refunded_at!, lang), amount: formatCurrency(payment.refunded_amount!, lang) })
                  : t('payments.paid_at', { date: formatDate(payment.paid_at!, lang), time: formatTime(payment.paid_at!, lang) })
              }
            </Typography>
            {/* Payment amount */}
            <Typography variant="h5" sx={{ mt: 2 }} >
              {t('payments.payment_info')}
            </Typography>
            <Typography variant="body1" color='text.secondary'>
              {t('payments.amount', {amount: formatCurrency(payment.amount, lang)})}  
            </Typography>
            {/* Payment method */}
            <Typography variant="body1" color='text.secondary'> 
              {t('payments.method', { method: t(`payments.methods.${payment.payment_method}`) })}
            </Typography>
            {/* Transaction ID */}
            {payment.transaction_id && (
              <Typography variant="body1" color='text.secondary'> 
                {t('payments.transaction_id', { id: payment.transaction_id })}
              </Typography>
            )}
            {/* Client info */}
            <Typography variant="h5" sx={{ mt: 2 }} >
              {t('payments.client_info')}
            </Typography>
            <Typography variant="body1" color='text.secondary'> 
              {t('payments.client', { id: payment.user.id, email: payment.user.email })}
            </Typography>
            {/* Détails du panier */}
            <Typography variant="h5" sx={{ mt: 2 }} >
              {t('payments.cart_details')}
            </Typography>
            <Box sx={{ mb: 3 }}>
              {payment.cart_snapshot.map((item, index) => (
                <Typography key={index} variant="body2" color='text.secondary'>
                  ID {item.product_id} - {item.product_name} - {t('payments.places', { count: item.ticket_places })}<br/>
                  {t('payments.quantity', { quantity: item.quantity })}<br/>
                </Typography>
              ))}
            </Box>
          

            {/* Refund section shown only for paid non-free payments */}
            { payment.payment_method !== 'free' && payment.status === 'paid' && (
              <>
                <Divider />
                <CardActions sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="h5">
                    {t('payments.refund_label')}
                  </Typography>
                  <Typography variant="body2" color='text.secondary' sx={{ mb: 2 }}>
                    {t('payments.refund_info')}
                  </Typography>
                  <TextField
                    label={t('payments.refund_amount')}
                    value={refundAmount}
                    onChange={e => setRefundAmount(e.target.value)}
                    size="small"
                    type="number"
                    fullWidth
                    slotProps={{ 
                      inputLabel: { shrink: true },
                      input: { 
                        endAdornment: (
                          <Chip label="€" size="small" />
                        ),
                        inputProps: {
                          min: 0,
                          step: 0.01,
                        },
                      }, 
                    }}
                    sx={{ mb: 1 }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    disabled={refunding || !refundAmount || parseFloat(refundAmount) <= 0 || isNaN(parseFloat(refundAmount)) || parseFloat(refundAmount) > payment.amount}
                    onClick={handleRefund}
                    sx={{ width: 'fit-content', alignSelf: 'flex-end' }}
                    startIcon={refunding ? <CircularProgress size={16} /> : undefined}
                  >
                    {refunding
                      ? t('payments.refunding')
                      : t('payments.confirm_refund')
                    }
                  </Button>
                </CardActions>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}