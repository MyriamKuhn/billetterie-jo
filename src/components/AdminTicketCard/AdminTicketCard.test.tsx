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

// --- mocks des dépendances ------------------------------------------------
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
    qrHookReturn   = { qrUrl: null, loading: false }
    prodHookReturn = {
      product: { product_details: { date: '2025-01-01', time: '10:00', location: 'Lyon' } },
      loading: false, error: null
    }
  })

  it('montre le skeleton quand prodLoading=true', () => {
    prodHookReturn.loading = true
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('notifie et logue en cas d’erreur prodError', async () => {
    prodHookReturn = { product: null, loading: false, error: new Error('boom') }
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith('Failed fetching product details', prodHookReturn.error)
      expect(notifyMock).toHaveBeenCalledWith('errors.product_fetch_failed', 'warning')
    })
  })

  it('affiche placeholder QR quand qrLoading, puis icône quand qrUrl=null', () => {
    qrHookReturn.loading = true
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.queryByTestId('CardMedia')).toBeNull()
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()

    qrHookReturn = { qrUrl: null, loading: false }
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.getByTestId('QrCodeIcon')).toBeInTheDocument()
  })

  it('affiche QR quand qrUrl disponible', () => {
    qrHookReturn = { qrUrl: 'http://x/qr.png', loading: false }
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'http://x/qr.png')
  })

  it('header: affiche free_ticket quand paid+discounted_price=0', () => {
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    const chips = screen.getAllByTestId('Chip')
    expect(chips.some(c => c.textContent === 'orders.free_ticket')).toBeTruthy()
    expect(chips.some(c => c.getAttribute('data-color') === 'success')).toBeTruthy()
  })

  it('filtre status + bouton Save activé/inactif + save success & échec', async () => {
    onSave.mockResolvedValueOnce(true)
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)

    const btnSave = screen.getByText('orders.save')
    expect(btnSave).toBeDisabled()

    fireEvent.change(screen.getByTestId('filter'), { target: { value: 'filters.status_used' } })
    expect(btnSave).toBeEnabled()

    fireEvent.click(btnSave)
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(42, { status: 'used' })
      expect(notifyMock).toHaveBeenCalledWith('orders.save_success', 'success')
      expect(onRefresh).toHaveBeenCalled()
    })

    onSave.mockResolvedValueOnce(false)
    fireEvent.change(screen.getByTestId('filter'), { target: { value: 'filters.status_refunded' } })
    fireEvent.click(btnSave)
    await waitFor(() => {
      expect(notifyMock).toHaveBeenCalledWith('errors.save_error', 'error')
    })
  })

  describe('Couverture des cas non testés', () => {
    it('affiche les bonnes couleurs pour les statuts de paiement non-paid', () => {
      const statuses: { status: AdminTicket['payment']['status']; color: string }[] = [
        { status: 'pending', color: 'info' },
        { status: 'refunded', color: 'warning' },
        { status: 'failed', color: 'error' },
        // cas par défaut : statut inconnu
        { status: 'unknown' as any, color: 'default' }
      ];

      statuses.forEach(({ status, color }) => {
        const ticket: AdminTicket = {
          ...baseTicket,
          payment: { ...baseTicket.payment, status },
          product_snapshot: { ...baseTicket.product_snapshot, discounted_price: 50 } // non-gratuit
        };
        // on récupère le container isolé pour ce rendu
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

    it('notifie warning si pas de pdf_filename', () => {
      // Utiliser une chaîne vide plutôt que `undefined`
      const ticketNoPdf: AdminTicket = { ...baseTicket, pdf_filename: '' };
      render(<AdminTicketCard ticket={ticketNoPdf} onSave={onSave} onRefresh={onRefresh} />);
      fireEvent.click(screen.getByText('orders.download_ticket'));
      expect(notifyMock).toHaveBeenCalledWith('errors.no_pdf', 'warning');
    });

    it('notifie error si le download du ticket échoue', async () => {
      downloadTicketMock.mockRejectedValueOnce(new Error('fail'));
      render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />);
      fireEvent.click(screen.getByText('orders.download_ticket'));
      await waitFor(() => {
        expect(downloadTicketMock).toHaveBeenCalledWith(baseTicket.pdf_filename);
        expect(notifyMock).toHaveBeenCalledWith('errors.download_error', 'error');
      });
    });

    it('notifie error si le download de la facture échoue', async () => {
      // on simule un prix non-nul pour activer le bouton facture
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

describe('Couverture supplémentaire', () => {
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
    // mock de useInView qui renvoie [ref, inView, entry?]
    vi
      .spyOn(intersectionObserver, 'useInView')
      .mockReturnValue([() => {}, true, undefined] as any)
    // mocks par défaut des hooks de download
    vi
      .spyOn(ticketHook, 'useAdminDownloadTicket')
      .mockReturnValue({ download: vi.fn(), downloading: false })
    vi
      .spyOn(invoiceHook, 'useAdminDownloadInvoice')
      .mockReturnValue({ download: vi.fn(), downloading: false })
  })

  it('initialise selectedLabel depuis statusMap', () => {
    const ticketUsed = { ...baseTicket, status: 'used' as const }
    render(<AdminTicketCard ticket={ticketUsed} onSave={onSave} onRefresh={onRefresh} />)
    const select = screen.getByTestId('filter')
    expect(select.getAttribute('data-prop-value')).toBe('filters.status_used')
  })

  it('affiche orders.no_product quand useProductDetails renvoie product=null sans erreur', () => {
    // on mock le hook pour renvoyer product=null et error=null
    vi
      .spyOn(productDetailsHook, 'useProductDetails')
      .mockReturnValue({ product: null, loading: false, error: null });

    const ticketNoSnap: AdminTicket = {
      ...baseTicket,
      // même si product_snapshot est undefined, c'est le hook qui détermine la sortie
      product_snapshot: undefined as any
    };

    render(<AdminTicketCard ticket={ticketNoSnap} onSave={onSave} onRefresh={onRefresh} />);

    // on doit trouver le fallback 'orders.no_product'
    expect(screen.getByText('orders.no_product')).toBeInTheDocument();
  });

  it('désactive le bouton download quand ticketLoading=true', () => {
    vi.spyOn(ticketHook, 'useAdminDownloadTicket').mockReturnValue({ download: vi.fn(), downloading: true })
    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    const btn = screen.getByText('orders.download_ticket')
    expect(btn).toBeDisabled()
  })

  it('désactive le bouton invoice quand invoiceLoading=true', () => {
    // mettre un prix payant pour activer le bouton facture
    const ticketWithPrice = {
      ...baseTicket,
      product_snapshot: { ...baseTicket.product_snapshot, discounted_price: 20 }
    }
    vi.spyOn(invoiceHook, 'useAdminDownloadInvoice').mockReturnValue({ download: vi.fn(), downloading: true })
    render(<AdminTicketCard ticket={ticketWithPrice} onSave={onSave} onRefresh={onRefresh} />)
    const btn = screen.getByText('orders.download_invoice')
    expect(btn).toBeDisabled()
  })

  it('affiche le placeholder QR quand inView=false', () => {
    // on force maintenant inView à false
    vi
      .spyOn(intersectionObserver, 'useInView')
      .mockReturnValue([() => {}, false, undefined] as any)

    render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)
    // elle doit afficher l'icône QR (mockée avec data-testid="QrCodeIcon")
    expect(screen.getByTestId('QrCodeIcon')).toBeInTheDocument()
  })

  it('initialise selectedLabel à une chaîne vide si le statut n’est pas dans statusMap', () => {
    const ticketUnknownStatus = {
      ...baseTicket,
      status: 'unexpected' as any
    };
    render(<AdminTicketCard ticket={ticketUnknownStatus} onSave={onSave} onRefresh={onRefresh} />);
    const select = screen.getByTestId('filter');
    expect(select.getAttribute('data-prop-value')).toBe('');
  });

  describe('Couverture finale', () => {
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

    it('appelle useLanguageStore avec un selector qui renvoie state.lang', () => {
      render(<AdminTicketCard ticket={baseTicket} onSave={onSave} onRefresh={onRefresh} />)

      // useLanguageStore doit avoir été appelé une fois
      expect(useLanguageStore).toHaveBeenCalledTimes(1)

      // @ts-ignore accéder au mock.calls
      const selector = (useLanguageStore as any).mock.calls[0][0] as (s: { lang: string }) => string

      // si on passe { lang: 'pt-BR' } au selector, il doit nous renvoyer 'pt-BR'
      expect(selector({ lang: 'pt-BR' })).toBe('pt-BR')
    })
  })
})
