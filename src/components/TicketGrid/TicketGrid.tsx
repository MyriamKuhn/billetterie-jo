import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Ticket } from '../../types/tickets'
import { TicketCard } from '../TicketCard'
import { useTranslation } from 'react-i18next'

interface TicketGridProps {
  tickets: Ticket[]
}

export function TicketGrid({ tickets }: TicketGridProps) {
  const { t } = useTranslation('tickets')

  if (tickets.length === 0) {
    return (
      <Typography variant="h6" align="center" sx={{ mt: 4 }}>
        {t('tickets.no_tickets')}
      </Typography>
    )
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
      {tickets.map(ticket => (
        <TicketCard
          key={ticket.token}
          ticket={ticket}
          invoiceLink={ticket.payment_uuid || ''}
        />
      ))}
    </Box>
  )
}
