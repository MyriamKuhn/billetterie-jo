import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { AdminPayments } from '../../types/admin'
import { AdminPaymentCard } from '../AdminPaymentCard'

interface AdminPaymentGridProps {
  payments: AdminPayments[]
  onSave: (uuid: string, refund: { amount: number }) => Promise<boolean>;
  onRefresh: () => void;
}

export function AdminPaymentGrid({ payments, onSave, onRefresh }: AdminPaymentGridProps) {
  const { t } = useTranslation('payments')

  if (payments.length === 0) {
    return (
      <Typography variant="h4" sx={{ textAlign: 'center' }}>
        {t('errors.no_payments')}
      </Typography>
    );
  }

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
