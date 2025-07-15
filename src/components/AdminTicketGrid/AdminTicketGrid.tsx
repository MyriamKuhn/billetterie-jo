import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { AdminTicket } from '../../types/admin'
import { CreateTicketCard } from '../CreateTicketCard'
import type { TicketStatus } from '../../types/tickets'
import { AdminTicketCard } from '../AdminTicketCard'

interface AdminTicketGridProps {
  tickets: AdminTicket[]
  onSave: (id: number, update: {
    status: TicketStatus
  }) => Promise<boolean>;
  onRefresh: () => void;
  onCreate: () => void;
}

/**
 * AdminTicketGrid
 *
 * Renders a grid of existing tickets along with a card to create a new one.
 * - If there are no tickets, displays a centered error message.
 * - Otherwise, shows a CreateTicketCard followed by one AdminTicketCard per ticket.
 */
export function AdminTicketGrid({ tickets, onSave, onRefresh, onCreate }: AdminTicketGridProps) {
  const { t } = useTranslation('orders')

  // Render a message if there are no tickets
  if (tickets.length === 0) {
    return (
      <Typography variant="h4" sx={{ textAlign: 'center' }}>
        {t('errors.not_found_tickets')}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 4, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, flexDirection: { xs: 'row', md: 'column' }}}>
      {/* Card to trigger ticket creation */}
      <CreateTicketCard onCreate={onCreate} />
      {/* One AdminTicketCard per ticket, passing through handlers */}
      {tickets.map(ticket => (
        <AdminTicketCard
          key={ticket.token}
          ticket={ticket}
          onSave={onSave}
          onRefresh={onRefresh}
        />
      ))}
    </Box>
  )
}
