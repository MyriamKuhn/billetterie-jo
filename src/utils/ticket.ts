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