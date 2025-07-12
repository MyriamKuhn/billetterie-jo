// src/components/AdminTicketGrid/AdminTicketGrid.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

// on mock useTranslation pour renvoyer simplement la clé
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// on mock CreateTicketCard pour capter onCreate
const createMock = vi.fn()
vi.mock('../CreateTicketCard', () => ({
  CreateTicketCard: ({ onCreate }: any) => (
    <button data-testid="create-card" onClick={() => onCreate()} />
  ),
}))

// on mock AdminTicketCard pour capter ticket, onSave, onRefresh
const saveMock = vi.fn()
const refreshMock = vi.fn()
vi.mock('../AdminTicketCard', () => ({
  AdminTicketCard: ({ ticket, onSave, onRefresh }: any) => (
    <div data-testid="admin-card">
      <span>{ticket.token}</span>
      <button
        data-testid={`save-${ticket.token}`}
        onClick={() => onSave(ticket.id, { status: 'ok' })}
      />
      <button
        data-testid={`refresh-${ticket.token}`}
        onClick={() => onRefresh()}
      />
    </div>
  ),
}))

import { AdminTicketGrid } from './AdminTicketGrid'
import type { AdminTicket } from '../../types/admin'

describe('AdminTicketGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche un message d’erreur quand il n’y a pas de tickets', () => {
    render(
      <AdminTicketGrid
        tickets={[]}
        onCreate={createMock}
        onSave={saveMock}
        onRefresh={refreshMock}
      />
    )
    // la clé passée à t()
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(
      'errors.not_found_tickets'
    )
  })

  it('affiche la CreateTicketCard puis un AdminTicketCard par ticket', () => {
    const tickets: AdminTicket[] = [
      { id: 1, token: 'AAA', /* autres champs éventuels */ } as any,
      { id: 2, token: 'BBB' } as any,
    ]

    render(
      <AdminTicketGrid
        tickets={tickets}
        onCreate={createMock}
        onSave={saveMock}
        onRefresh={refreshMock}
      />
    )

    // 1 create-card
    const createBtn = screen.getByTestId('create-card')
    expect(createBtn).toBeInTheDocument()

    // 2 admin-card
    const adminCards = screen.getAllByTestId('admin-card')
    expect(adminCards).toHaveLength(2)
    // contenus respectifs
    expect(adminCards[0]).toHaveTextContent('AAA')
    expect(adminCards[1]).toHaveTextContent('BBB')

    // test du callback onCreate
    fireEvent.click(createBtn)
    expect(createMock).toHaveBeenCalledOnce()

    // test du callback onSave et onRefresh sur chaque carte
    fireEvent.click(screen.getByTestId('save-AAA'))
    expect(saveMock).toHaveBeenCalledTimes(1);
    const [calledId, calledUpdate] = saveMock.mock.calls[0];
    expect(calledId).toBe(1);
    expect(calledUpdate).toEqual({ status: 'ok' });

    fireEvent.click(screen.getByTestId('refresh-BBB'))
    expect(refreshMock).toHaveBeenCalled()
  })
})
