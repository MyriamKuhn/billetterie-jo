import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// -----------------------------------------------------------------------------
// Mocks globaux
// -----------------------------------------------------------------------------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      if (opts?.reference)         return `${key}-${opts.reference}`
      if (opts?.date || opts?.time) return `${key}-${opts.date||''}-${opts.time||''}`.replace(/-+$/,'')
      if (opts?.amount)            return `${key}-${opts.amount}`
      if (opts?.method)            return `${key}-${opts.method}`
      if (opts?.id && opts?.email) return `${key}-${opts.id}-${opts.email}`
      if (opts?.count)             return `${key}-${opts.count}`
      if (opts?.quantity)          return `${key}-${opts.quantity}`
      return key
    }
  })
}))

vi.mock('../../utils/format', () => ({
  formatDate:     (d: string, l: string) => `DATE(${d},${l})`,
  formatTime:     (d: string, l: string) => `TIME(${d},${l})`,
  formatCurrency: (a: number, l: string) => `CURRENCY(${a},${l})`,
}))

vi.mock('../../stores/useLanguageStore', () => ({
  useLanguageStore: (sel: any) => sel({ lang: 'en' })
}))

let mockDownload: ReturnType<typeof vi.fn>
let mockDownloading = false
vi.mock('../../hooks/useAdminDownloadInvoice', () => ({
  useAdminDownloadInvoice: () => ({ download: mockDownload, downloading: mockDownloading })
}))

let mockNotify: ReturnType<typeof vi.fn>
vi.mock('../../hooks/useCustomSnackbar', () => ({
  useCustomSnackbar: () => ({ notify: mockNotify })
}))

// -----------------------------------------------------------------------------
// Mocks MUI simplifiés – Propagation des props et testid
// -----------------------------------------------------------------------------
vi.mock('@mui/material/Box',             () => ({ default: ({ children, ...rest }: any) => <div data-testid="Box" {...rest}>{children}</div> }))
vi.mock('@mui/material/Card',            () => ({ default: ({ children }: any) => <div data-testid="Card">{children}</div> }))
vi.mock('@mui/material/CardContent',     () => ({ default: ({ children }: any) => <div data-testid="CardContent">{children}</div> }))
vi.mock('@mui/material/Typography',      () => ({ default: ({ children }: any) => <p data-testid="Typography">{children}</p> }))
vi.mock('@mui/material/Chip',            () => ({ default: ({ label, color }: any) => <span data-testid="Chip" data-color={color}>{label}</span> }))
vi.mock('@mui/material/Tooltip',         () => ({ default: ({ title, children }: any) => <div data-testid="Tooltip" title={title}>{children}</div> }))
vi.mock('@mui/material/CircularProgress',() => ({ default: () => <span data-testid="Spinner" /> }))
vi.mock('@mui/icons-material/Receipt',   () => ({ default: () => <span data-testid="ReceiptIcon" /> }))
vi.mock('@mui/material/TextField',       () => ({ default: (p: any) => <input data-testid="TextField" {...p}/> }))
vi.mock('@mui/material/Button',          () => ({ default: (p: any) => <button data-testid="Button" {...p}>{p.children}</button> }))
vi.mock('@mui/material/Divider',         () => ({ default: () => <hr data-testid="Divider" /> }))
vi.mock('@mui/material/CardActions',     () => ({ default: ({ children }: any) => <div data-testid="CardActions">{children}</div> }))

import { AdminPaymentCard, getPaymentStatusChipColor } from './AdminPaymentCard'
import type { AdminPayments, AdminPaymentsStatus } from '../../types/admin'

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------
describe('getPaymentStatusChipColor()', () => {
  it('maps known statuses correctly', () => {
    expect(getPaymentStatusChipColor('paid')).toBe('success')
    expect(getPaymentStatusChipColor('pending')).toBe('info')
    expect(getPaymentStatusChipColor('refunded')).toBe('warning')
    expect(getPaymentStatusChipColor('failed')).toBe('error')
  })
  it('falls back to default for unknown', () => {
    // @ts-ignore
    expect(getPaymentStatusChipColor('foo')).toBe('default')
  })
})

describe('<AdminPaymentCard />', () => {
  const basePayment: AdminPayments = {
    uuid: 'U1',
    created_at: '2025-07-10T10:00:00Z',
    paid_at: '2025-07-11T11:00:00Z',
    refunded_at: '2025-07-12T12:00:00Z',
    refunded_amount: 50,
    amount: 100,
    status: 'paid',
    payment_method: 'stripe',
    invoice_link: 'http://inv.url',
    transaction_id: 'txn123',
    updated_at: '2025-07-12T12:30:00Z',
    user: { id: 42, email: 'a@b.c' },
    cart_snapshot: [
      {
        product_id: 1,
        product_name: 'P1',
        ticket_type: 'standard',
        ticket_places: 2,
        quantity: 3,
        unit_price: 100,
        discount_rate: 0,
        discounted_price: 100,
      },
    ],
  }

  let onSave: ReturnType<typeof vi.fn>
  let onRefresh: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockDownload = vi.fn()
    mockDownloading = false
    mockNotify = vi.fn()
    onSave = vi.fn()
    onRefresh = vi.fn()
  })

  it('renders paid → download icon, paid date & refund UI', () => {
    render(<AdminPaymentCard payment={basePayment} onSave={onSave} onRefresh={onRefresh} />)

    // reference & uuid
    expect(screen.getByText(/payments\.reference/)).toBeInTheDocument()
    expect(screen.getByText(/U1/)).toBeInTheDocument()

    // chip color
    expect(screen.getByTestId('Chip')).toHaveAttribute('data-color','success')

    // paid date
    expect(
      screen.getByText('payments.paid_at-DATE(2025-07-11T11:00:00Z,en)-TIME(2025-07-11T11:00:00Z,en)')
    ).toBeInTheDocument()

    // amount & info
    expect(screen.getByText('payments.payment_info')).toBeInTheDocument()
    expect(screen.getByText('payments.amount-CURRENCY(100,en)')).toBeInTheDocument()

    // method
    expect(screen.getByText('payments.method-payments.methods.stripe')).toBeInTheDocument()

    // client & cart
    expect(screen.getByText('payments.client-42-a@b.c')).toBeInTheDocument()
    expect(
      screen.getByText((text) =>
        /ID\s*1/.test(text) &&
        /P1/.test(text) &&
        /payments\.places-2/.test(text)
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText((text) => /payments\.quantity-3/.test(text))
    ).toBeInTheDocument()

    // refund UI present
    expect(document.querySelector('hr')).toBeInTheDocument()
    expect(screen.getByText('payments.refund_label')).toBeInTheDocument()
    expect(screen.getByTestId('TextField')).toBeInTheDocument()
  })

  it('clicking ReceiptIcon when paid calls download', () => {
    render(<AdminPaymentCard payment={basePayment} onSave={onSave} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByTestId('ReceiptIcon'))
    expect(mockDownload).toHaveBeenCalledWith('http://inv.url')
    expect(mockNotify).not.toHaveBeenCalled()
  })

  it('shows spinner when downloading & status allows download', () => {
    mockDownloading = true
    render(<AdminPaymentCard payment={basePayment} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.getByTestId('Spinner')).toBeInTheDocument()
    expect(screen.queryByTestId('ReceiptIcon')).toBeNull()
  })

  it('pending status → tooltip + warning notify', () => {
    const p = { ...basePayment, status: 'pending' as AdminPaymentsStatus }
    render(<AdminPaymentCard payment={p} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.getByTestId('Tooltip')).toHaveAttribute('title','payments.download_not_ready')
    fireEvent.click(screen.getByTestId('ReceiptIcon'))
    expect(mockDownload).not.toHaveBeenCalled()
    expect(mockNotify).toHaveBeenCalledWith('snackbar.pending_message','warning')
  })

  it('failed status → tooltip + error notify', () => {
    const p = { ...basePayment, status: 'failed' as AdminPaymentsStatus }
    render(<AdminPaymentCard payment={p} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.getByTestId('Tooltip')).toHaveAttribute('title','payments.download_not_available')
    fireEvent.click(screen.getByTestId('ReceiptIcon'))
    expect(mockNotify).toHaveBeenCalledWith('snackbar.failed_message','error')
  })

  it('other status → generic unavailable notify', () => {
    const p = { ...basePayment, status: 'foobar' as AdminPaymentsStatus }
    render(<AdminPaymentCard payment={p} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.getByTestId('Tooltip')).toHaveAttribute('title','payments.download_not_available_generic')
    fireEvent.click(screen.getByTestId('ReceiptIcon'))
    expect(mockNotify).toHaveBeenCalledWith('snackbar.unavailable_message','info')
  })

  it('renders created_at for free payment_method', () => {
    const p: AdminPayments = {
      ...basePayment,
      status: 'paid' as AdminPaymentsStatus,
      payment_method: 'free' as AdminPayments['payment_method'],
    }
    render(<AdminPaymentCard payment={p} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.getByText(/^payments\.created_at-/)).toBeInTheDocument()
  })

  it('renders created_at for pending/failed statuses', () => {
    for (const status of ['pending','failed'] as AdminPaymentsStatus[]) {
      const p = { ...basePayment, status }
      render(<AdminPaymentCard payment={p} onSave={onSave} onRefresh={onRefresh} />)
      expect(screen.getByText(/^payments\.created_at-/)).toBeInTheDocument()
      document.body.innerHTML = ''
    }
  })

  it('renders refunded_at when status=refunded', () => {
    const p = { ...basePayment, status: 'refunded' as AdminPaymentsStatus }
    render(<AdminPaymentCard payment={p} onSave={onSave} onRefresh={onRefresh} />)
    expect(
      screen.getByText((text) =>
        /payments\.refunded_at/.test(text) &&
        /DATE\(2025-07-12T12:00:00Z,en\)/.test(text) &&
        /TIME\(2025-07-12T12:00:00Z,en\)/.test(text)
      )
    ).toBeInTheDocument()
  })

  it('refund flow success then failure', async () => {
    render(<AdminPaymentCard payment={basePayment} onSave={onSave} onRefresh={onRefresh} />)
    fireEvent.change(screen.getByTestId('TextField'), { target: { value: '30' } })
    const btn = screen.getByTestId('Button')
    onSave.mockResolvedValueOnce(true)
    fireEvent.click(btn)
    await waitFor(() => expect(mockNotify).toHaveBeenCalledWith('payments.refund_success','success'))
    expect(onRefresh).toHaveBeenCalled()
    onSave.mockResolvedValueOnce(false)
    fireEvent.change(screen.getByTestId('TextField'), { target: { value: '20' } })
    fireEvent.click(btn)
    await waitFor(() => expect(mockNotify).toHaveBeenCalledWith('payments.refund_error','error'))
  })

  it('no refund UI when payment_method=free', () => {
    const p: AdminPayments = {
      ...basePayment,
      status: 'paid' as AdminPaymentsStatus,
      payment_method: 'free' as AdminPayments['payment_method'],
    }
    render(<AdminPaymentCard payment={p} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.queryByText('payments.refund_label')).toBeNull()
    expect(screen.queryByTestId('TextField')).toBeNull()
  })
})
