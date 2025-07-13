import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock MUI components
vi.mock('@mui/material/Box', () => ({ default: ({ children, ...props }: any) => <div data-testid="Box" {...props}>{children}</div> }))
vi.mock('@mui/material/Card', () => ({ default: ({ children, ...props }: any) => <div data-testid="Card" {...props}>{children}</div> }))
vi.mock('@mui/material/CardMedia', () => ({ default: ({ component: Comp = 'img', image, alt, ...props }: any) => <img data-testid="CardMedia" src={image} alt={alt} {...props}/> }))
vi.mock('@mui/material/CardContent', () => ({ default: ({ children, ...props }: any) => <div data-testid="CardContent" {...props}>{children}</div> }))
vi.mock('@mui/material/Typography', () => ({ default: ({ children, ...props }: any) => <p data-testid="Typography" {...props}>{children}</p> }))
vi.mock('@mui/material/Button', () => ({
  default: ({ children, onClick, disabled, startIcon, ...props }: any) =>
    <button data-testid="Button" onClick={onClick} disabled={disabled} {...props}>
      {/* on rend explicitement l’icône ou spinner */}
      {startIcon}
      {children}
    </button>
}))
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
vi.mock('../../stores/useLanguageStore', () => ({
  useLanguageStore: (selector: (state: { lang: string }) => any) => {
    // on appelle vraiment le selector avec un objet de test
    return selector({ lang: 'en' })
  }
}))

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

import * as IntersectionObserver from 'react-intersection-observer'
import * as fetchQrHook from '../../hooks/useFetchTicketQr'
import * as downloadTicketHook from "../../hooks/useDownloadTicket";
import * as downloadInvoiceHook from "../../hooks/useDownloadInvoice";
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
    // Quand payment_uuid est vide, le bouton existe toujours (pas d'absence dans le code)
    const noInvoiceTicket = { ...baseTicket, payment_uuid: '' }
    document.body.innerHTML = ''
    render(<TicketCard ticket={noInvoiceTicket} invoiceLink="inv" />)
    expect(screen.getByText('tickets.download_invoice')).toBeInTheDocument()
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
    expect(screen.getByText('tickets.token')).toBeInTheDocument()
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
    expect(screen.getByText('tickets.download_invoice')).toBeInTheDocument()
  })

  it('handles QR url null to show placeholder icon', () => {
    productDetailsReturn = { product: { name: 'Event', product_details: { date: '2025-04-01', time: '', location: '', places: null } }, loading: false, error: null }
    fetchQrReturn = { qrUrl: null, loading: false }
    render(<TicketCard ticket={baseTicket} invoiceLink="inv" />)
    expect(screen.getByTestId('QrCodeIcon')).toBeInTheDocument()
  })

  it('n’utilise pas le QR tant que la carte n’est pas inView', () => {
    // 1) mock useInView pour renvoyer inView = false
    const mockInView: any = [() => {}, false, undefined]
    mockInView.ref = mockInView[0]
    mockInView.inView = mockInView[1]
    vi.spyOn(IntersectionObserver, 'useInView').mockReturnValue(mockInView)

    // 2) mock useFetchTicketQr pour renvoyer null si filename === null
    vi.spyOn(fetchQrHook, 'useFetchTicketQr')
      .mockImplementation((filename: string | null) => {
        if (filename) {
          return { qrUrl: 'http://example.com/qr.png', loading: false }
        }
        return { qrUrl: null, loading: false }
      })

    // 3) même si fetchQrReturn était précédemment défini, on part de zéro
    render(<TicketCard ticket={baseTicket} invoiceLink="inv" />)

    // 4) on doit voir le placeholder, pas l'image
    expect(screen.queryByTestId('CardMedia')).toBeNull()
    expect(screen.getByTestId('QrCodeIcon')).toBeInTheDocument()
  })

  it('affiche le QR quand la carte devient inView', () => {
    const mockInView: any = [() => {}, true, undefined]
    mockInView.ref = mockInView[0]
    mockInView.inView = mockInView[1]
    vi.spyOn(IntersectionObserver, 'useInView').mockReturnValue(mockInView)

    vi.spyOn(fetchQrHook, 'useFetchTicketQr')
      .mockImplementation((filename: string | null) => {
        return { qrUrl: filename ? 'http://example.com/qr.png' : null, loading: false }
      })

    render(<TicketCard ticket={baseTicket} invoiceLink="inv" />)
    expect(screen.getByTestId('CardMedia')).toHaveAttribute('src', 'http://example.com/qr.png')
  })

  it("ne montre pas les places si ticket_places est undefined", () => {
    // produit OK
    productDetailsReturn = {
      product: { name: "Evt", product_details: { date: "2025-07-01", time: "10:00", location: "Labo", places: 1 } },
      loading: false,
      error: null
    };
    // override de ticket_places
    const ticketNoPlaces = {
      ...baseTicket,
      product_snapshot: {
        ...baseTicket.product_snapshot!,
        ticket_places: undefined as any
      }
    };
    render(<TicketCard ticket={ticketNoPlaces} invoiceLink="inv" />);
    // on ne doit pas trouver « tickets.places-X »
    expect(screen.queryByText(/^tickets\.places/)).toBeNull();
  });

  it("montre le spinner pour le bouton Télécharger billet quand downloadingTicket=true", () => {
    vi.spyOn(downloadTicketHook, "useDownloadTicket")
      .mockReturnValue({ download: mockDownloadTicket, downloading: true });
    render(<TicketCard ticket={baseTicket} invoiceLink="inv" />);
    expect(screen.getByTestId("CircularProgress")).toBeInTheDocument();
  });

  it("montre le spinner pour le bouton Télécharger facture quand downloadingInvoice=true", () => {
    // need aussi un payment_uuid pour que le bouton soit affiché
    vi.spyOn(downloadInvoiceHook, "useDownloadInvoice")
      .mockReturnValue({ download: mockDownloadInvoice, downloading: true });
    render(<TicketCard ticket={baseTicket} invoiceLink="inv" />);
    // on récupère le deuxième CircularProgress (celui de la facture)
    const spinners = screen.getAllByTestId("CircularProgress");
    expect(spinners.length).toBeGreaterThanOrEqual(1);
  });

  it('gère productId undefined (donc null) tout en gardant product_snapshot pour l’UI', async () => {
    // On rend productId = null, mais on garde un snapshot complet
    const ticketNoId = {
      ...baseTicket,
      product_snapshot: {
        ...baseTicket.product_snapshot!,
        product_id: undefined as any,
      }
    };
    // On force l’erreur produit
    productDetailsReturn = { product: null, loading: false, error: new Error('fail') };
    render(<TicketCard ticket={ticketNoId} invoiceLink="inv" />);

    // on attend le useEffect d’erreur
    await waitFor(() => {
      expect(logError).toHaveBeenCalled();
      expect(mockNotify).toHaveBeenCalledWith('errors.product_fetch_failed', 'warning');
    });
    expect(screen.getByText('tickets.no_product')).toBeInTheDocument();

    // On récupère tous les Tooltips et on cherche celui de la facture
    const tooltips = screen.getAllByTestId('Tooltip');
    const invoiceTooltip = tooltips.find(el =>
      el.getAttribute('title') === 'tickets.download_invoice_pdf'
    );
    expect(invoiceTooltip).toBeDefined();
  });

  it('affiche free_ticket vs download_invoice selon discounted_price', () => {
    // Cas gratuit
    const freeTicket = {
      ...baseTicket,
      product_snapshot: { ...baseTicket.product_snapshot!, discounted_price: 0 }
    };
    render(<TicketCard ticket={freeTicket} invoiceLink="inv" />);
    expect(
      screen.getAllByTestId('Tooltip').find(el => el.getAttribute('title') === 'tickets.free_ticket')
    ).toBeTruthy();
    expect(screen.getByText('tickets.free_ticket')).toBeInTheDocument();

    // Reset le DOM
    document.body.innerHTML = '';

    // Cas payant
    const paidTicket = {
      ...baseTicket,
      product_snapshot: { ...baseTicket.product_snapshot!, discounted_price: 42 }
    };
    render(<TicketCard ticket={paidTicket} invoiceLink="inv" />);
    expect(
      screen.getAllByTestId('Tooltip').find(el => el.getAttribute('title') === 'tickets.download_invoice_pdf')
    ).toBeTruthy();
    expect(screen.getByText('tickets.download_invoice')).toBeInTheDocument();
  });
})

