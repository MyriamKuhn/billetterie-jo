import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AdminPayments } from '../../types/admin'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

// Mock MUI Box and Typography to simplify DOM
vi.mock('@mui/material/Box',      () => ({ default: ({ children }: any) => <div data-testid="Box">{children}</div> }))
vi.mock('@mui/material/Typography',() => ({ default: ({ children }: any) => <h4>{children}</h4> }))

// Mock the AdminPaymentCard to just render the uuid
vi.mock('../AdminPaymentCard', () => ({
  AdminPaymentCard: ({ payment }: { payment: AdminPayments }) => <div data-testid="Card">{payment.uuid}</div>
}))

import { AdminPaymentGrid } from './AdminPaymentGrid'

describe('<AdminPaymentGrid />', () => {
  let onSave: ReturnType<typeof vi.fn>
  let onRefresh: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onSave = vi.fn()
    onRefresh = vi.fn()
  })

  it('affiche un message quand il n’y a aucun paiement', () => {
    render(<AdminPaymentGrid payments={[]} onSave={onSave} onRefresh={onRefresh} />)
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('errors.no_payments')
  })

  it('rend une carte par paiement', () => {
    const payments: AdminPayments[] = [
      { uuid: 'A1', /* … autres props inchangées… */ } as any,
      { uuid: 'B2' } as any,
    ]
    render(<AdminPaymentGrid payments={payments} onSave={onSave} onRefresh={onRefresh} />)
    const cards = screen.getAllByTestId('Card')
    // Deux cartes pour A1 et B2
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('A1')
    expect(cards[1]).toHaveTextContent('B2')
  })
})
