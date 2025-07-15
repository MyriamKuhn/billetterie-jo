import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Ticket } from '../../types/tickets'
import { TicketCard } from '../TicketCard'
import { useTranslation } from 'react-i18next'

interface TicketGridProps {
  tickets: Ticket[]
}

/**
 * Renders a responsive grid of TicketCard components, or a "no tickets" message when the list is empty.
 * This component is used to display a collection of tickets in a visually appealing manner.
 */
export function TicketGrid({ tickets }: TicketGridProps) {
  const { t } = useTranslation('tickets')

  // If there are no tickets, show a centered message with some top margin
  if (tickets.length === 0) {
    return (
      <Typography variant="h6" align="center" sx={{ mt: 4 }}>
        {t('tickets.no_tickets')}
      </Typography>
    )
  }

  // Otherwise, render each TicketCard in a flex-wrapped container
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
