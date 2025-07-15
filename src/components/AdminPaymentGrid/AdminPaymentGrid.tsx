import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { AdminPayments } from '../../types/admin'
import { AdminPaymentCard } from '../AdminPaymentCard'

interface AdminPaymentGridProps {
  /** Array of payment objects to display */
  payments: AdminPayments[]
  /** Called to process a refund for a given payment UUID */
  onSave: (uuid: string, refund: { amount: number }) => Promise<boolean>;
  /** Called to refresh the parent list after changes */
  onRefresh: () => void;
}

/**
 * Renders a grid or list of payment cards.
 *
 * - If there are no payments, shows a centered message.
 * - Otherwise lays out each AdminPaymentCard responsively.
 */
export function AdminPaymentGrid({ payments, onSave, onRefresh }: AdminPaymentGridProps) {
  const { t } = useTranslation('payments')

  // Show a fallback message when there are no payments
  if (payments.length === 0) {
    return (
      <Typography variant="h4" sx={{ textAlign: 'center' }}>
        {t('errors.no_payments')}
      </Typography>
    );
  }

  // Display each payment in a flex container that wraps on mobile
  return (
    <Box sx={{ display: 'flex', gap: 4, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, flexDirection: { xs: 'row', md: 'column' }}}>
      {payments.map(payment => (
        <AdminPaymentCard
          key={payment.uuid}
          payment={payment}
          onSave={onSave}
          onRefresh={onRefresh}
        />
      ))}
    </Box>
  )
}
