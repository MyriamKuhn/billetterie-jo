import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useTranslation
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

// Mock MUI components
vi.mock('@mui/material/Box', () => ({ default: ({ children, ...props }: any) => <div data-testid="Box" {...props}>{children}</div> }))
vi.mock('@mui/material/Typography', () => ({ default: ({ children, ...props }: any) => <p data-testid="Typography" {...props}>{children}</p> }))

// Mock TicketCard
vi.mock('../TicketCard', () => ({ TicketCard: ({ ticket, invoiceLink }: any) => (
  <div data-testid="TicketCard">
    <span data-testid="TicketToken">{ticket.token}</span>
    <span data-testid="InvoiceLink">{invoiceLink}</span>
  </div>
) }))

import { TicketGrid } from './TicketGrid'
import type { Ticket } from '../../types/tickets'

describe('TicketGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders no tickets message when empty', () => {
    render(<TicketGrid tickets={[]} />)
    // Should render Typography with t('tickets.no_tickets') text
    const typography = screen.getByTestId('Typography')
    expect(typography).toBeInTheDocument()
    expect(typography).toHaveTextContent('tickets.no_tickets')
  })

  it('renders a TicketCard for each ticket when non-empty', () => {
    const tickets: Ticket[] = [
      { token: 'tok1', payment_uuid: 'pay1', /* other required fields stubbed */ id: 1, status: 'issued', qr_filename: '', pdf_filename: '', product_snapshot: { product_id: 1, product_name: 'Name', ticket_type: '', ticket_places: 1, quantity: 1, unit_price: 0, discount_rate: 0, discounted_price: 0 }, used_at: null, refunded_at: null, cancelled_at: null },
      { token: 'tok2', payment_uuid: '', id: 2, status: 'issued', qr_filename: '', pdf_filename: '', product_snapshot: { product_id: 2, product_name: 'Name2', ticket_type: '', ticket_places: 2, quantity: 1, unit_price: 0, discount_rate: 0, discounted_price: 0 }, used_at: null, refunded_at: null, cancelled_at: null },
    ]
    render(<TicketGrid tickets={tickets} />)
    // Should render Box as container
    const box = screen.getByTestId('Box')
    expect(box).toBeInTheDocument()
    // Two TicketCard instances
    const cardElements = screen.getAllByTestId('TicketCard')
    expect(cardElements.length).toBe(2)
    // Check that each TicketCard received correct props: token and invoiceLink
    const tokenSpans = screen.getAllByTestId('TicketToken')
    const invoiceSpans = screen.getAllByTestId('InvoiceLink')
    expect(tokenSpans[0]).toHaveTextContent('tok1')
    expect(invoiceSpans[0]).toHaveTextContent('pay1')
    expect(tokenSpans[1]).toHaveTextContent('tok2')
    // payment_uuid empty yields invoiceLink ''
    expect(invoiceSpans[1]).toHaveTextContent('')
  })
})
