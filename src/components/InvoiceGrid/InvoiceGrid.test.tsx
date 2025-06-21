import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useTranslation to return t function that returns fallback or key
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key }) }))
// Mock InvoiceCard to a simple component for testing InvoiceGrid
vi.mock('../InvoiceCard', () => ({
  InvoiceCard: ({ invoice }: { invoice: any }) => <div data-testid="invoice-card">{invoice.uuid}</div>
}))

import { InvoiceGrid } from './InvoiceGrid'
import type { Invoice } from '../../types/invoices'

describe('InvoiceGrid component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders no_found message when invoices array is empty', () => {
    render(<InvoiceGrid invoices={[]} />)
    // Because useTranslation mock returns key when no fallback, t('invoices.no_found') returns 'invoices.no_found'
    const message = screen.getByText('invoices.no_found')
    expect(message).toBeInTheDocument()
    // Should be a Typography element, but we check text presence
  })

  it('renders InvoiceCard for each invoice when invoices array is non-empty', () => {
    const invoices: Invoice[] = [
      { uuid: '1', created_at: '', amount: 0, status: 'paid', invoice_link: '', download_url: '' },
      { uuid: '2', created_at: '', amount: 0, status: 'pending', invoice_link: '', download_url: '' },
      { uuid: '3', created_at: '', amount: 0, status: 'failed', invoice_link: '', download_url: '' },
    ]
    render(<InvoiceGrid invoices={invoices} />)
    const items = screen.getAllByTestId('invoice-card')
    expect(items).toHaveLength(invoices.length)
    // Verify that each invoice.uuid appears
    invoices.forEach(inv => {
      expect(screen.getByText(inv.uuid)).toBeInTheDocument()
    })
  })
})
