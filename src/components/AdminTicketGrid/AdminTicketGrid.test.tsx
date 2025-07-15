import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

// Mock useTranslation to simply echo the key
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Mock CreateTicketCard to capture the onCreate callback
const createMock = vi.fn()
vi.mock('../CreateTicketCard', () => ({
  CreateTicketCard: ({ onCreate }: any) => (
    <button data-testid="create-card" onClick={() => onCreate()} />
  ),
}))

// Mock AdminTicketCard to capture ticket data, onSave, and onRefresh
const saveMock = vi.fn()
const refreshMock = vi.fn()
vi.mock('../AdminTicketCard', () => ({
  AdminTicketCard: ({ ticket, onSave, onRefresh }: any) => (
    <div data-testid="admin-card">
      {/* Display the ticket token */}
      <span>{ticket.token}</span>
      {/* Button to trigger the onSave callback */}
      <button
        data-testid={`save-${ticket.token}`}
        onClick={() => onSave(ticket.id, { status: 'ok' })}
      />
      {/* Button to trigger the onRefresh callback */}
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
    // Reset all mock call counts before each test
    vi.clearAllMocks()
  })

  it('shows an error message when there are no tickets', () => {
    render(
      <AdminTicketGrid
        tickets={[]}
        onCreate={createMock}
        onSave={saveMock}
        onRefresh={refreshMock}
      />
    )
    // Expect a heading with the error translation key
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(
      'errors.not_found_tickets'
    )
  })

  it('renders CreateTicketCard and one AdminTicketCard per ticket', () => {
    // Sample ticket data
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

    // Should render exactly one CreateTicketCard
    const createBtn = screen.getByTestId('create-card')
    expect(createBtn).toBeInTheDocument()

    // Should render an AdminTicketCard for each ticket
    const adminCards = screen.getAllByTestId('admin-card')
    expect(adminCards).toHaveLength(2)
    expect(adminCards[0]).toHaveTextContent('AAA')
    expect(adminCards[1]).toHaveTextContent('BBB')

    // Clicking the create button triggers the onCreate callback once
    fireEvent.click(createBtn)
    expect(createMock).toHaveBeenCalledOnce()

    // Clicking a save button triggers onSave with correct parameters
    fireEvent.click(screen.getByTestId('save-AAA'))
    expect(saveMock).toHaveBeenCalledTimes(1);
    const [calledId, calledUpdate] = saveMock.mock.calls[0];
    expect(calledId).toBe(1);
    expect(calledUpdate).toEqual({ status: 'ok' });

    // Clicking a refresh button triggers the onRefresh callback
    fireEvent.click(screen.getByTestId('refresh-BBB'))
    expect(refreshMock).toHaveBeenCalled()
  })
})
