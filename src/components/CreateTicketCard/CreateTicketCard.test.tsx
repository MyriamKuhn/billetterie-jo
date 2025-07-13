import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'
import { CreateTicketCard } from './CreateTicketCard'

// mock de react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

describe('<CreateTicketCard />', () => {
  it('affiche les bonnes clés de traduction', () => {
    const mockOnCreate = vi.fn()
    render(<CreateTicketCard onCreate={mockOnCreate} />)

    // on doit voir les trois clés retournées par t()
    expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent('tickets.create_new')
    expect(screen.getByText('tickets.create_intro')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('tickets.create_button')
  })

  it('appelle onCreate quand on clique sur le bouton', () => {
    const mockOnCreate = vi.fn()
    render(<CreateTicketCard onCreate={mockOnCreate} />)

    fireEvent.click(screen.getByRole('button'))
    expect(mockOnCreate).toHaveBeenCalledTimes(1)
  })
})
