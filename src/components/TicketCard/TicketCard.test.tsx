import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock MUI components
vi.mock('@mui/material/Box', () => ({ default: ({ children, ...props }: any) => <div data-testid="Box" {...props}>{children}</div> }))
vi.mock('@mui/material/Card', () => ({ default: ({ children, ...props }: any) => <div data-testid="Card" {...props}>{children}</div> }))
vi.mock('@mui/material/CardMedia', () => ({ default: ({ component: Comp = 'img', image, alt, ...props }: any) => <img data-testid="CardMedia" src={image} alt={alt} {...props}/> }))
vi.mock('@mui/material/CardContent', () => ({ default: ({ children, ...props }: any) => <div data-testid="CardContent" {...props}>{children}</div> }))
vi.mock('@mui/material/Typography', () => ({ default: ({ children, ...props }: any) => <p data-testid="Typography" {...props}>{children}</p> }))
vi.mock('@mui/material/Button', () => ({ default: ({ children, onClick, disabled, ...props }: any) => <button data-testid="Button" onClick={onClick} disabled={disabled} {...props}>{children}</button> }))
vi.mock('@mui/material/Tooltip', () => ({ default: ({ children, title }: any) => <div data-testid="Tooltip" title={title}>{children}</div> }))
vi.mock('@mui/material/CircularProgress', () => ({ default: ({  }: any) => <span data-testid="CircularProgress">Loading</span> }))
// Mock Chip to capture color prop
vi.mock('@mui/material/Chip', () => ({ default: ({ label, color }: any) => <span data-testid="Chip" data-color={color}>{label}</span> }))
vi.mock('@mui/material/Skeleton', () => ({ default: (props: any) => <div data-testid="Skeleton" {...props} /> }))

// Mock icons
vi.mock('@mui/icons-material/QrCode', () => ({ default: () => <span data-testid="QrCodeIcon" /> }))
vi.mock('@mui/icons-material/FileDownload', () => ({ default: () => <span data-testid="DownloadIcon" /> }))
vi.mock('@mui/icons-material/Receipt', () => ({ default: () => <span data-testid="ReceiptIcon" /> }))

// Mock hooks
const mockDownloadTicket = vi.fn()
vi.mock('../../hooks/useDownloadTicket', () => ({ useDownloadTicket: () => ({ download: mockDownloadTicket, downloading: false }) }))

const mockDownloadInvoice = vi.fn()
vi.mock('../../hooks/useDownloadInvoice', () => ({ useDownloadInvoice: () => ({ download: mockDownloadInvoice, downloading: false }) }))

// useFetchTicketQr
let fetchQrReturn: any = { qrUrl: null, loading: false }
vi.mock('../../hooks/useFetchTicketQr', () => ({ useFetchTicketQr: (_inView: boolean) => fetchQrReturn }))

// useLanguageStore: mock selector invocation
vi.mock('../../stores/useLanguageStore', () => ({ useLanguageStore: () => (selector: any) => selector({ lang: 'en' }) }))

// useCustomSnackbar
const mockNotify = vi.fn()
vi.mock('../../hooks/useCustomSnackbar', () => ({ useCustomSnackbar: () => ({ notify: mockNotify }) }))

// useProductDetails
let productDetailsReturn: any = { product: null, loading: false, error: null }
vi.mock('../../hooks/useProductDetails', () => ({ useProductDetails: (_productId: any, _lang: string) => productDetailsReturn }))

// useInView
vi.mock('react-intersection-observer', () => ({ useInView: (_opts: any) => ({ ref: (_el: any) => {}, inView: true }) }))

// formatDate
vi.mock('../../utils/format', () => ({ formatDate: (date: string, lang: string) => `formatted-${date}-${lang}` }))

// Mock logError inline
vi.mock('../../utils/logger', () => ({ logError: vi.fn() }))
import { logError } from '../../utils/logger'

import { TicketCard } from './TicketCard'
import type { Ticket } from '../../types/tickets'

// Mock TicketCardSkeleton
vi.mock('../TicketCardSkeleton', () => ({ TicketCardSkeleton: () => <div data-testid="TicketCardSkeleton" /> }))

// Mock useTranslation to handle pluralization options
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, options?: any) => {
    if (options && typeof options.count === 'number') {
      return `${key}-${options.count}`
    }
    return key
  } }) }))

beforeEach(() => {
  vi.clearAllMocks()
  fetchQrReturn = { qrUrl: null, loading: false }
  productDetailsReturn = { product: null, loading: false, error: null }
  mockDownloadTicket.mockReset()
  mockDownloadInvoice.mockReset()
})

describe('TicketCard', () => {
  const baseTicket: Ticket = {
    id: 1,
    token: 'tok123',
    status: 'issued',
    qr_filename: 'qr.png',
    pdf_filename: 'ticket.pdf',
    payment_uuid: 'pay123',
    product_snapshot: {
      product_id: 123,
      product_name: 'EventName',
      ticket_type: 'standard',
      ticket_places: 5,
      quantity: 1,
      unit_price: 100,
      discount_rate: 0,
      discounted_price: 100,
    },
    used_at: null,
    refunded_at: null,
    cancelled_at: null,
  }

  it('renders skeleton when loadingProduct is true', () => {
    productDetailsReturn = { product: null, loading: true, error: null }
    render(<TicketCard ticket={baseTicket} invoiceLink="inv" />)
    expect(screen.getByTestId('TicketCardSkeleton')).toBeInTheDocument()
  })

  it('handles productError: shows fallback and notifies', async () => {
    productDetailsReturn = { product: null, loading: false, error: new Error('fail') }
    render(<TicketCard ticket={baseTicket} invoiceLink="inv" />)
    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith('Error by retrieving product details for the ticket', productDetailsReturn.error)
      expect(mockNotify).toHaveBeenCalledWith('errors.product_fetch_failed', 'warning')
    })
    expect(screen.getByText('tickets.no_product')).toBeInTheDocument()
  })

  it('covers status-to-color mapping via Chip color prop', () => {
    const statuses: Array<{status: Ticket['status'], expectedColor: string}> = [
      { status: 'used', expectedColor: 'success' },
      { status: 'issued', expectedColor: 'info' },
      { status: 'refunded', expectedColor: 'warning' },
      { status: 'cancelled', expectedColor: 'error' },
      { status: 'unknown' as any, expectedColor: 'default' },
    ]
    statuses.forEach(({ status, expectedColor }) => {
      const ticket = { ...baseTicket, status }
      render(<TicketCard ticket={ticket} invoiceLink="inv" />)
      const chip = screen.getByTestId('Chip')
      expect(chip).toHaveAttribute('data-color', expectedColor)
      document.body.innerHTML = ''
    })
  })

  it('handles download errors for ticket and invoice', async () => {
    productDetailsReturn = { product: { name: 'EventName', product_details: { date: '2025-03-01', time: '12:00', location: 'Venue', places: 5 } }, loading: false, error: null }
    fetchQrReturn = { qrUrl: null, loading: false }
    mockDownloadTicket.mockRejectedValueOnce(new Error('fail-download'))
    render(<TicketCard ticket={baseTicket} invoiceLink="inv" />)
    fireEvent.click(screen.getByText('tickets.download_ticket'))
    await waitFor(() => expect(mockNotify).toHaveBeenCalledWith('errors.download_error', 'error'))
    mockDownloadInvoice.mockRejectedValueOnce(new Error('fail-invoice'))
    fireEvent.click(screen.getByText('tickets.download_invoice'))
    await waitFor(() => expect(mockNotify).toHaveBeenCalledWith('errors.invoice_download_error', 'error'))
    // For no_invoice: assert absence of button when payment_uuid is empty
    const noInvoiceTicket = { ...baseTicket, payment_uuid: '' }
    document.body.innerHTML = ''
    render(<TicketCard ticket={noInvoiceTicket} invoiceLink="inv" />)
    expect(screen.queryByText('tickets.download_invoice')).toBeNull()
  })

  it('renders product details and handles QR/image and download buttons success and no_pdf', async () => {
    productDetailsReturn = { product: { name: 'EventName', product_details: { date: '2025-03-01', time: '12:00', location: 'Venue', places: 5 } }, loading: false, error: null }
    const { rerender } = render(<TicketCard ticket={baseTicket} invoiceLink="inv" />)
    fetchQrReturn = { qrUrl: null, loading: true }
    rerender(<TicketCard ticket={baseTicket} invoiceLink="inv" />)
    expect(screen.getByTestId('Skeleton')).toBeInTheDocument()
    fetchQrReturn = { qrUrl: 'http://example.com/qr.png', loading: false }
    rerender(<TicketCard ticket={baseTicket} invoiceLink="inv" />)
    const img = screen.getByTestId('CardMedia')
    expect(img).toHaveAttribute('src', 'http://example.com/qr.png')
    expect(screen.getAllByText('EventName').length).toBe(1)
    expect(screen.getByText(/tok123/)).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('formatted-2025-03-01') && content.includes('12:00'))).toBeInTheDocument()
    expect(screen.getByText('Venue')).toBeInTheDocument()
    expect(screen.getByText('tickets.places-5')).toBeInTheDocument()
    expect(screen.getByTestId('Chip')).toBeInTheDocument()
    mockDownloadTicket.mockResolvedValueOnce(undefined)
    fireEvent.click(screen.getByText('tickets.download_ticket'))
    await waitFor(() => expect(mockDownloadTicket).toHaveBeenCalledWith('ticket.pdf'))
    mockDownloadInvoice.mockResolvedValueOnce(undefined)
    fireEvent.click(screen.getByText('tickets.download_invoice'))
    await waitFor(() => expect(mockDownloadInvoice).toHaveBeenCalledWith('invoice_pay123.pdf'))
    const noPdfTicket = { ...baseTicket, pdf_filename: '' }
    rerender(<TicketCard ticket={noPdfTicket} invoiceLink="inv" />)
    fireEvent.click(screen.getByText('tickets.download_ticket'))
    expect(mockNotify).toHaveBeenCalledWith('tickets.no_pdf', 'warning')
    const noInvoiceTicket2 = { ...baseTicket, payment_uuid: '' }
    rerender(<TicketCard ticket={noInvoiceTicket2} invoiceLink="inv" />)
    expect(screen.queryByText('tickets.download_invoice')).toBeNull()
  })

  it('handles QR url null to show placeholder icon', () => {
    productDetailsReturn = { product: { name: 'Event', product_details: { date: '2025-04-01', time: '', location: '', places: null } }, loading: false, error: null }
    fetchQrReturn = { qrUrl: null, loading: false }
    render(<TicketCard ticket={baseTicket} invoiceLink="inv" />)
    expect(screen.getByTestId('QrCodeIcon')).toBeInTheDocument()
  })
})

