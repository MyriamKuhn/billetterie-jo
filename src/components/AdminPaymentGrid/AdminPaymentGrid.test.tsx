import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AdminPayments } from '../../types/admin'

// Mock i18n useTranslation to return keys directly
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

// Simplify MUI Box and Typography to basic DOM elements
vi.mock('@mui/material/Box',      () => ({ default: ({ children }: any) => <div data-testid="Box">{children}</div> }))
vi.mock('@mui/material/Typography',() => ({ default: ({ children }: any) => <h4>{children}</h4> }))

// Mock AdminPaymentCard to render only the payment.uuid
vi.mock('../AdminPaymentCard', () => ({
  AdminPaymentCard: ({ payment }: { payment: AdminPayments }) => <div data-testid="Card">{payment.uuid}</div>
}))

import { AdminPaymentGrid } from './AdminPaymentGrid'

describe('<AdminPaymentGrid />', () => {
  let onSave: ReturnType<typeof vi.fn>
  let onRefresh: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset handlers before each test
    onSave = vi.fn()
    onRefresh = vi.fn()
  })

  it('displays a message when there are no payments', () => {
    render(<AdminPaymentGrid payments={[]} onSave={onSave} onRefresh={onRefresh} />)
    // Expect heading level 4 with no-payments error key
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('errors.no_payments')
  })

  it('renders one card per payment', () => {
    const payments: AdminPayments[] = [
      { uuid: 'A1' } as any,
      { uuid: 'B2' } as any,
    ]
    render(<AdminPaymentGrid payments={payments} onSave={onSave} onRefresh={onRefresh} />)
    const cards = screen.getAllByTestId('Card')
    // Two cards should be rendered for A1 and B2
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('A1')
    expect(cards[1]).toHaveTextContent('B2')
  })
})
