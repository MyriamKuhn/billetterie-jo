import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock external dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key })
}))
vi.mock('../../utils/format', () => ({
  formatDate: (date: string, lang: string) => `formatted-date-${date}-${lang}`,
  formatCurrency: (amount: number, lang: string, currency: string) => `formatted-currency-${amount}-${lang}-${currency}`
}))
// CORRECTION du mock de useLanguageStore pour respecter selector
vi.mock('../../stores/useLanguageStore', () => ({
  useLanguageStore: (selector: (state: any) => any) => selector({ lang: 'en' })
}))

const mockDownload = vi.fn()
let mockDownloading = false
vi.mock('../../hooks/useDownloadInvoice', () => ({
  useDownloadInvoice: () => ({ download: mockDownload, downloading: mockDownloading })
}))

const mockNotify = vi.fn()
vi.mock('../../hooks/useCustomSnackbar', () => ({
  useCustomSnackbar: () => ({ notify: mockNotify })
}))

// Mock MUI components to simplify querying
vi.mock('@mui/material/Tooltip', () => ({
  default: ({ title, children }: any) => <div data-testid="tooltip" title={title}>{children}</div>
}))
vi.mock('@mui/material/CircularProgress', () => ({ default: () => <span data-testid="circular-progress" /> }))
vi.mock('@mui/icons-material/Receipt', () => ({ default: () => <span data-testid="receipt-icon" /> }))

import { InvoiceCard, getStatusChipColor } from './InvoiceCard'
import type { Invoice } from '../../types/invoices'

// Helper to render with invoice props
function renderInvoiceCard(invoice: Invoice) {
  render(<InvoiceCard invoice={invoice} />)
}

describe('getStatusChipColor', () => {
  it('should return correct colors for known statuses', () => {
    expect(getStatusChipColor('paid')).toBe('success')
    expect(getStatusChipColor('pending')).toBe('warning')
    expect(getStatusChipColor('failed')).toBe('error')
    expect(getStatusChipColor('refunded')).toBe('info')
  })
  it('should return default for unknown status', () => {
    // @ts-ignore: test unknown
    expect(getStatusChipColor('unknown')).toBe('default')
  })
})

describe('InvoiceCard', () => {
  beforeEach(() => {
    mockDownload.mockReset()
    mockNotify.mockReset()
    mockDownloading = false
  })

  it('renders invoice details correctly for paid status and allows download', () => {
    const invoice: Invoice = {
      uuid: '1234',
      created_at: '2025-06-20T12:00:00Z',
      amount: 100,
      status: 'paid',
      invoice_link: 'http://example.com/invoice.pdf',
      download_url: 'http://example.com/invoice.pdf',
    }
    renderInvoiceCard(invoice)
    // Check reference label
    expect(screen.getByText(/1234/)).toBeInTheDocument()
    // Check formatted date and amount (avec lang='en')
    expect(screen.getByText(/formatted-date-2025-06-20T12:00:00Z-en/)).toBeInTheDocument()
    expect(screen.getByText(/formatted-currency-100-en-EUR/)).toBeInTheDocument()
    // Receipt icon present
    const receipt = screen.getByTestId('receipt-icon')
    expect(receipt).toBeInTheDocument()
    // Click triggers download
    fireEvent.click(receipt.parentElement!)
    expect(mockDownload).toHaveBeenCalledWith(invoice.invoice_link)
    expect(mockNotify).not.toHaveBeenCalled()
  })

  it('shows CircularProgress when downloading is true and status allows download', () => {
    mockDownloading = true
    const invoice: Invoice = {
      uuid: '1234',
      created_at: '2025-06-20T12:00:00Z',
      amount: 100,
      status: 'paid',
      invoice_link: 'http://example.com/invoice.pdf',
      download_url: 'http://example.com/invoice.pdf',
    }
    renderInvoiceCard(invoice)
    // Should show CircularProgress instead of receipt icon
    expect(screen.queryByTestId('receipt-icon')).toBeNull()
    expect(screen.getByTestId('circular-progress')).toBeInTheDocument()
  })

  it('does not allow download for pending status and shows warning notification', () => {
    const invoice: Invoice = {
      uuid: '5678',
      created_at: '2025-06-20T12:00:00Z',
      amount: 200,
      status: 'pending',
      invoice_link: 'http://example.com/invoice2.pdf',
      download_url: 'http://example.com/invoice2.pdf',
    }
    renderInvoiceCard(invoice)
    const receiptWrapper = screen.getByTestId('receipt-icon').parentElement!
    fireEvent.click(receiptWrapper)
    expect(mockDownload).not.toHaveBeenCalled()
    expect(mockNotify).toHaveBeenCalledWith('snackbar.pending_message', 'warning')
  })

  it('does not allow download for failed status and shows error notification', () => {
    const invoice: Invoice = {
      uuid: '91011',
      created_at: '2025-06-20T12:00:00Z',
      amount: 300,
      status: 'failed',
      invoice_link: 'http://example.com/invoice3.pdf',
      download_url: 'http://example.com/invoice3.pdf',
    }
    renderInvoiceCard(invoice)
    const receiptWrapper = screen.getByTestId('receipt-icon').parentElement!
    fireEvent.click(receiptWrapper)
    expect(mockDownload).not.toHaveBeenCalled()
    expect(mockNotify).toHaveBeenCalledWith('snackbar.failed_message', 'error')
  })

  it('does not allow download for other statuses and shows generic info notification', () => {
    const invoice: Invoice = {
      uuid: '121314',
      created_at: '2025-06-20T12:00:00Z',
      amount: 400,
      // @ts-ignore: testing unknown status
      status: 'custom',
      invoice_link: 'http://example.com/invoice4.pdf',
      download_url: 'http://example.com/invoice4.pdf',
    }
    renderInvoiceCard(invoice)
    const receiptWrapper = screen.getByTestId('receipt-icon').parentElement!
    fireEvent.click(receiptWrapper)
    expect(mockDownload).not.toHaveBeenCalled()
    expect(mockNotify).toHaveBeenCalledWith('snackbar.unavailable_message', 'info')
  })
})

describe('InvoiceCard tooltip titles', () => {
  const cases = [
    { status: 'paid', expectedTitle: 'card.download_invoice' },
    { status: 'refunded', expectedTitle: 'card.download_invoice' },
    { status: 'pending', expectedTitle: 'card.download_not_ready' },
    { status: 'failed', expectedTitle: 'card.download_not_available' },
    { status: 'custom', expectedTitle: 'card.download_not_available_generic' },
  ] as Array<{ status: Invoice['status'] | string; expectedTitle: string }>

  it.each(cases)('status=%s => tooltip title=%s', ({ status, expectedTitle }) => {
    mockDownloading = false
    const invoice: Invoice = {
      uuid: 'test',
      created_at: '2025-06-20T12:00:00Z',
      amount: 0,
      // @ts-ignore
      status,
      invoice_link: '',
      download_url: '',
    }
    renderInvoiceCard(invoice)
    const tooltip = screen.getByTestId('tooltip')
    expect(tooltip).toHaveAttribute('title', expectedTitle)
  })
})
