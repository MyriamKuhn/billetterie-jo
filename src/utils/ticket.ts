/**
 * Returns the MUI Chip color corresponding to a ticket’s status.
 *
 * @param status  The ticket status string (e.g., 'issued', 'used', 'refunded', 'cancelled', etc.).
 * @returns       One of the MUI color variants: 'success', 'info', 'warning', 'error', or 'default'.
 */
export function getTicketStatusChipColor(status: string): 'success' | 'warning' | 'error' | 'default' | 'info' {
  switch (status) {
    case 'used':
      return 'success';
    case 'issued':
      return 'info';
    case 'refunded':
      return 'warning';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}