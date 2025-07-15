import { vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { AdminTicketCard } from './AdminTicketCard'
import type { AdminTicket } from '../../types/admin'
import { logError } from '../../utils/logger'
import * as intersectionObserver from 'react-intersection-observer'
import * as ticketHook from '../../hooks/useAdminDownloadTicket'
import * as invoiceHook from '../../hooks/useAdminDownloadInvoice'
import * as productDetailsHook from '../../hooks/useProductDetails'
import { useLanguageStore } from '../../stores/useLanguageStore'

// --- Dependency mocks ------------------------------------------------------
// Replace logger with a spy to verify error logging
vi.mock('../../utils/logger', () => ({ logError: vi.fn() }))
vi.mock('@mui/material/Skeleton',    () => ({ default: () => <div data-testid="skeleton" /> }))
vi.mock('@mui/material/CardMedia',    () => ({ default: ({ image, alt, ...p }: any) => <img data-testid="CardMedia" src={image} alt={alt} {...p}/> }))
vi.mock('@mui/material/Chip',         () => ({ default: ({ label, color }: any) => <span data-testid="Chip" data-color={color}>{label}</span> }))
vi.mock('@mui/material/Button',       () => ({ default: ({ children, onClick, disabled, ...p }: any) => <button data-testid="Button" onClick={onClick} disabled={disabled} {...p}>{children}</button> }))
vi.mock('@mui/material/Tooltip',      () => ({ default: ({ children }: any) => <div>{children}</div> }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: any) => {
    if (opts?.id)    return `#${opts.id}`
    if (opts?.price) return `${opts.price}`
    if (opts?.date)  return opts.date
    return key
  }})
}))
vi.mock('../../stores/useLanguageStore',   () => ({ useLanguageStore: vi.fn().mockReturnValue('en') }))
const notifyMock = vi.fn()
vi.mock('../../hooks/useCustomSnackbar',    () => ({ useCustomSnackbar: () => ({ notify: notifyMock }) }))
const downloadTicketMock = vi.fn()
vi.mock('../../hooks/useAdminDownloadTicket', () => ({ useAdminDownloadTicket: () => ({ download: downloadTicketMock, downloading: false }) }))
const downloadInvMock = vi.fn()
vi.mock('../../hooks/useAdminDownloadInvoice',() => ({ useAdminDownloadInvoice: () => ({ download: downloadInvMock, downloading: false }) }))
let qrHookReturn = { qrUrl: null as string|null, loading: false }
vi.mock('../../hooks/useAdminFetchTicketQr', () => ({ useAdminFetchTicketQr: () => qrHookReturn }))
let prodHookReturn: any = { product: { product_details: {} }, loading: false, error: null }
vi.mock('../../hooks/useProductDetails',    () => ({ useProductDetails: () => prodHookReturn }))
vi.mock('react-intersection-observer',      () => ({ useInView: () => ({ ref: () => {}, inView: true }) }))
vi.mock('../TicketCardSkeleton',            () => ({ TicketCardSkeleton: () => <div data-testid="skeleton" /> }))
vi.mock('../FilterSelect',                  () => ({
  FilterSelect: (props: any) => (
    <select data-testid="filter" value={props.value} onChange={e => props.onChange(e.target.value)}>
      {props.options.map((o: string) => <option key={o}>{o}</option>)}
    </select>
  )
}))
vi.mock('../FilterSelect', () => ({
  FilterSelect: (props: any) => (
    <select
      data-testid="filter"
      data-prop-value={props.value}
      value={props.value}
      onChange={e => props.onChange(e.target.value)}
    >
      {props.options.map((o: string) => <option key={o}>{o}</option>)}
    </select>
  )
}))

// ----------------------------------------------------------------------------

describe('AdminTicketCard', () => {
  // A base ticket object used across tests
  const baseTicket: AdminTicket = {
    id: 42,
    token: 'tok-xyz',
    qr_filename: 'qr.png',
    pdf_filename: 'file.pdf',
    payment: { id: 1, uuid: 'pay-1', status: 'paid' },
    payment_uuid: 'pay-1',
    product_snapshot: {
      product_id: 7, product_name: 'Evt', ticket_type: 'standard',
      ticket_places: 2, quantity: 1, unit_price: 100,
      discount_rate: 0, discounted_price: 0
    },
    user: { id: 3, firstname: 'Jane', lastname: 'Doe', email: 'jane@x' },
    created_at: '2025-01-01',
    updated_at: '2025-01-05',
    used_at: '2025-01-02',
    refunded_at: '2025-01-03',
    cancelled_at: '2025-01-04',
    status: 'issued'
  }
  const onSave = vi.fn()
  const onRefresh = vi.fn()

  beforeEach(() => {
    // Reset all spies/mocks and default hook return values before each test
    vi.clearAllMocks()
    qrHookReturn   = { qrUrl: null, loading: false }
    prodHookReturn = {
      product: { product_details: { date: '2025-01-01', time: '10:00', location: 'Lyon' } },
      loading: false, error: null
    }
  })

  it('shows skeleton while product details are loading', () => {
    prodHookReturn.loading = true
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('logs error and notifies when product fetch fails', async () => {
    prodHookReturn = { product: null, loading: false, error: new Error('boom') }
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    await waitFor(() => {
      // Expect our logger and snackbar to be called with proper keys
      expect(logError).toHaveBeenCalledWith('Failed fetching product details', prodHookReturn.error)
      expect(notifyMock).toHaveBeenCalledWith('errors.product_fetch_failed', 'warning')
    })
  })

  it('renders QR placeholder when loading, then icon if no URL', () => {
    // While fetching QR
    qrHookReturn.loading = true
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.queryByTestId('CardMedia')).toBeNull()
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()

    // Once loading done but no QR URL
    qrHookReturn = { qrUrl: null, loading: false }
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.getByTestId('QrCodeIcon')).toBeInTheDocument()
  })

  it('displays actual QR image when URL is available', () => {
    qrHookReturn = { qrUrl: 'http://x/qr.png', loading: false }
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'http://x/qr.png')
  })

  it('shows “free ticket” badge when price is zero', () => {
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    const chips = screen.getAllByTestId('Chip')
    // One of them should read the free-ticket key, with a “success” color
    expect(chips.some(c => c.textContent === 'orders.free_ticket')).toBeTruthy()
    expect(chips.some(c => c.getAttribute('data-color') === 'success')).toBeTruthy()
  })

  it('status filter enables/disables Save, and save success/failure flows', async () => {
    // Simulate successful save
    onSave.mockResolvedValueOnce(true)
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)

    const btnSave = screen.getByText('orders.save')
    expect(btnSave).toBeDisabled()  // disabled until filter changes

    // Change status to “used”
    fireEvent.change(screen.getByTestId('filter'), { target: { value: 'filters.status_used' } })
    expect(btnSave).toBeEnabled()

    // Click Save → success path
    fireEvent.click(btnSave)
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(42, { status: 'used' })
      expect(notifyMock).toHaveBeenCalledWith('orders.save_success', 'success')
      expect(onRefresh).toHaveBeenCalled()
    })

    // Simulate save failure
    onSave.mockResolvedValueOnce(false)
    fireEvent.change(screen.getByTestId('filter'), { target: { value: 'filters.status_refunded' } })
    fireEvent.click(btnSave)
    await waitFor(() => {
      expect(notifyMock).toHaveBeenCalledWith('errors.save_error', 'error')
    })
  })

  describe('Additional edge-case coverage', () => {
    it('applies correct badge colors for non-paid statuses', () => {
      const statuses: { status: AdminTicket['payment']['status']; color: string }[] = [
        { status: 'pending', color: 'info' },
        { status: 'refunded', color: 'warning' },
        { status: 'failed', color: 'error' },
        { status: 'unknown' as any, color: 'default' }
      ];

      statuses.forEach(({ status, color }) => {
        const ticket: AdminTicket = {
          ...baseTicket,
          payment: { ...baseTicket.payment, status },
          // give it a positive price so it's not a free ticket
          product_snapshot: { ...baseTicket.product_snapshot, discounted_price: 50 } 
        };
      const { container } = render(
        <AdminTicketCard
          ticket={ticket}
          onSave={onSave}
          onRefresh={onRefresh}
        />
      );
      const chip = within(container).getByTestId('Chip');
      expect(chip.textContent).toBe(`invoices.status.${status}`);
      expect(chip.getAttribute('data-color')).toBe(color);
      });
    });

    it('warns when no PDF is available', () => {
      const ticketNoPdf: AdminTicket = { ...baseTicket, pdf_filename: '' };
      render(<AdminTicketCard ticket={ticketNoPdf} onSave={onSave} onRefresh={onRefresh} />);
      fireEvent.click(screen.getByText('orders.download_ticket'));
      expect(notifyMock).toHaveBeenCalledWith('errors.no_pdf', 'warning');
    });

    it('handles ticket download errors', async () => {
      downloadTicketMock.mockRejectedValueOnce(new Error('fail'));
      render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />);
      fireEvent.click(screen.getByText('orders.download_ticket'));
      await waitFor(() => {
        expect(downloadTicketMock).toHaveBeenCalledWith(baseTicket.pdf_filename);
        expect(notifyMock).toHaveBeenCalledWith('errors.download_error', 'error');
      });
    });

    it('handles invoice download errors', async () => {
      const ticketWithPrice = {
        ...baseTicket,
        product_snapshot: { ...baseTicket.product_snapshot, discounted_price: 20 }
      };
      downloadInvMock.mockRejectedValueOnce(new Error('fail-invoice'));
      render(<AdminTicketCard ticket={ticketWithPrice} onSave={onSave} onRefresh={onRefresh} />);
      fireEvent.click(screen.getByText('orders.download_invoice'));
      await waitFor(() => {
        // le nom de fichier invoqué correspond à invoice_<uuid>.pdf
        expect(downloadInvMock).toHaveBeenCalledWith(`invoice_${baseTicket.payment.uuid}.pdf`);
        expect(notifyMock).toHaveBeenCalledWith('errors.invoice_download_error', 'error');
      });
    });
  })
});

describe('Extra coverage', () => {
  const baseTicket: AdminTicket = {
    id: 42,
    token: 'tok-xyz',
    qr_filename: 'qr.png',
    pdf_filename: 'file.pdf',
    payment: { id: 1, uuid: 'pay-1', status: 'paid' },
    payment_uuid: 'pay-1',
    product_snapshot: {
      product_id: 7, product_name: 'Evt', ticket_type: 'standard',
      ticket_places: 2, quantity: 1, unit_price: 100,
      discount_rate: 0, discounted_price: 0
    },
    user: { id: 3, firstname: 'Jane', lastname: 'Doe', email: 'jane@x' },
    created_at: '2025-01-01',
    updated_at: '2025-01-05',
    used_at: '2025-01-02',
    refunded_at: '2025-01-03',
    cancelled_at: '2025-01-04',
    status: 'issued'
  }
  const onSave = vi.fn()
  const onRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Force intersectionObserver to report inView
    vi
      .spyOn(intersectionObserver, 'useInView')
      .mockReturnValue([() => {}, true, undefined] as any)
    // Reset download hooks
    vi
      .spyOn(ticketHook, 'useAdminDownloadTicket')
      .mockReturnValue({ download: vi.fn(), downloading: false })
    vi
      .spyOn(invoiceHook, 'useAdminDownloadInvoice')
      .mockReturnValue({ download: vi.fn(), downloading: false })
  })

  it('initializes selectedLabel from the statusMap', () => {
    const ticketUsed = { ...baseTicket, status: 'used' as const }
    render(<AdminTicketCard ticket={ticketUsed} onSave={onSave} onRefresh={onRefresh} />)
    const select = screen.getByTestId('filter')
    expect(select.getAttribute('data-prop-value')).toBe('filters.status_used')
  })

  it('shows “no product” when hook returns no product and no error', () => {
    vi
      .spyOn(productDetailsHook, 'useProductDetails')
      .mockReturnValue({ product: null, loading: false, error: null });

    const ticketNoSnap: AdminTicket = {
      ...baseTicket,
      product_snapshot: undefined as any
    };

    render(<AdminTicketCard ticket={ticketNoSnap} onSave={onSave} onRefresh={onRefresh} />);

    expect(screen.getByText('orders.no_product')).toBeInTheDocument();
  });

  it('disables download button when ticketLoading is true', () => {
    vi.spyOn(ticketHook, 'useAdminDownloadTicket').mockReturnValue({ download: vi.fn(), downloading: true })
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    const btn = screen.getByText('orders.download_ticket')
    expect(btn).toBeDisabled()
  })

  it('disables invoice button when invoiceLoading is true', () => {
    const ticketWithPrice = {
      ...baseTicket,
      product_snapshot: { ...baseTicket.product_snapshot, discounted_price: 20 }
    }
    vi.spyOn(invoiceHook, 'useAdminDownloadInvoice').mockReturnValue({ download: vi.fn(), downloading: true })
    render(<AdminTicketCard ticket={ticketWithPrice} onSave={onSave} onRefresh={onRefresh} />)
    const btn = screen.getByText('orders.download_invoice')
    expect(btn).toBeDisabled()
  })

  it('shows QR icon placeholder when out of view', () => {
    vi
      .spyOn(intersectionObserver, 'useInView')
      .mockReturnValue([() => {}, false, undefined] as any)

    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.getByTestId('QrCodeIcon')).toBeInTheDocument()
  })

  it('falls back to empty label when status not in statusMap', () => {
    const ticketUnknownStatus = {
      ...baseTicket,
      status: 'unexpected' as any
    };
    render(<AdminTicketCard ticket={ticketUnknownStatus} onSave={onSave} onRefresh={onRefresh} />);
    const select = screen.getByTestId('filter');
    expect(select.getAttribute('data-prop-value')).toBe('');
  });

  describe('Final coverage', () => {
    const baseTicket: AdminTicket = {
      id: 42,
      token: 'tok-xyz',
      qr_filename: 'qr.png',
      pdf_filename: 'file.pdf',
      payment: { id: 1, uuid: 'pay-1', status: 'paid' },
      payment_uuid: 'pay-1',
      product_snapshot: {
        product_id: 7, product_name: 'Evt', ticket_type: 'standard',
        ticket_places: 2, quantity: 1, unit_price: 100,
        discount_rate: 0, discounted_price: 0
      },
      user: { id: 3, firstname: 'Jane', lastname: 'Doe', email: 'jane@x' },
      created_at: '2025-01-01',
      updated_at: '2025-01-05',
      used_at: '2025-01-02',
      refunded_at: '2025-01-03',
      cancelled_at: '2025-01-04',
      status: 'issued'
    }
    const onSave = vi.fn()
    const onRefresh = vi.fn()

    it('calls useLanguageStore selector to get state.lang', () => {
      render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)

      // Should have been called once
      expect(useLanguageStore).toHaveBeenCalledTimes(1)

      // @ts-ignore 
      const selector = (useLanguageStore as any).mock.calls[0][0] as (s: { lang: string }) => string
      expect(selector({ lang: 'pt-BR' })).toBe('pt-BR')
    })
  })
})
