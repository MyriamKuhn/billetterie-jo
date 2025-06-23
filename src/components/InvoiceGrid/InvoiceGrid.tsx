import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Invoice } from '../../types/invoices'
import { InvoiceCard } from '../InvoiceCard'
import { useTranslation } from 'react-i18next'

interface Props {
  invoices: Invoice[]
}

export function InvoiceGrid({ invoices }: Props) {
  const { t } = useTranslation('invoices')

  if (invoices.length === 0) {
    return <Typography variant="h6" align="center">{t('invoices.no_found')}</Typography>
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        justifyContent: { xs: 'center', md: 'flex-start' },
      }}
    >
      {invoices.map(inv => (
        <InvoiceCard key={inv.uuid} invoice={inv} />
      ))}
    </Box>
  )
}
