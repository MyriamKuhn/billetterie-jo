import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Invoice } from '../../types/invoices'
import { InvoiceCard } from '../InvoiceCard'
import { useTranslation } from 'react-i18next'

interface Props {
  invoices: Invoice[]
}

/**
 * Renders a responsive grid of InvoiceCard components, or a message when none are available.
 * This component is designed to display a list of invoices in a flexible layout.
 * It uses Material-UI's Box and Typography components for layout and text styling.
 */
export function InvoiceGrid({ invoices }: Props) {
  const { t } = useTranslation('invoices')

  // If no invoices, display a "none found" message
  if (invoices.length === 0) {
    return <Typography variant="h6" align="center">{t('invoices.no_found')}</Typography>
  }

  // Otherwise, render each invoice in a flex-wrapped grid
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
