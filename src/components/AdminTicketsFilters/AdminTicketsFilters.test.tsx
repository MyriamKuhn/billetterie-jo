import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AdminTicketsFilters } from './AdminTicketsFilters'
import { useUsers } from '../../hooks/useUsers'
import { useAuthStore } from '../../stores/useAuthStore'

// --- Mocks ------------------------------------------------
// Mock the translation hook to return the key directly
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (s: string) => s })
}))
vi.mock('../../stores/useAuthStore', () => ({
  useAuthStore: vi.fn()
}))
vi.mock('../../hooks/useUsers', () => ({
  useUsers: vi.fn()
}))
vi.mock('../FilterSelect', () => ({
  FilterSelect: ({ label, value, options, onChange }: any) => (
    <select data-testid={label} value={value} onChange={e => onChange(e.target.value)}>
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  )
}))
// ----------------------------------------------------------

describe('AdminTicketsFilters', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    // Clear previous mocks and set up default returns
    vi.clearAllMocks()
    ;(useAuthStore as any).mockReturnValue('tok-123')
    ;(useUsers as any).mockReturnValue({
      users: [
        { id: 5, firstname: 'John', lastname: 'Doe', email: 'john@x' },
        { id: 6, firstname: 'Jane', lastname: 'Roe', email: 'jane@x' }
      ],
      loading: false
    })
  })

  const defaultFilters = {
    status: 'issued' as const,
    user_id: undefined,
    per_page: 10,
    page: 2
  }

  it('passes correct params and token to useUsers', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    // Expect auth store selector to be called
    expect(useAuthStore).toHaveBeenCalled()
    // Expect useUsers hook to receive empty search fields, huge perPage, reset to page 1, and the token
    expect(useUsers).toHaveBeenCalledWith(
      { firstname: '', lastname: '', email: '', perPage: 1000000000, page: 1 },
      'tok-123',
      'user'
    )
  })

  it('handles status change via FilterSelect', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    const [statusSelect] = screen.getAllByTestId('filters.status_label') as HTMLSelectElement[]
    // Initially shows the translated "issued" label
    expect(statusSelect.value).toBe('filters.status_issued')
    // Change to "used"
    fireEvent.change(statusSelect, { target: { value: 'filters.status_used' } })
    // Expect onChange called with new status and page reset to 1
    expect(mockOnChange).toHaveBeenCalledWith({ status: 'used', page: 1 })
  })

  it('handles per_page change via FilterSelect', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    const [, perPageSelect] = screen.getAllByTestId('filters.per_page') as HTMLSelectElement[]
    // Initially 10 items per page
    expect(perPageSelect.value).toBe('10')
    // Change to 25 items
    fireEvent.change(perPageSelect, { target: { value: '25' } })
    // Expect onChange called with new per_page and page reset
    expect(mockOnChange).toHaveBeenCalledWith({ per_page: 25, page: 1 })
  })

  it('resets all filters when Reset button is clicked', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    const [resetBtn] = screen.getAllByText('filters.reset')
    fireEvent.click(resetBtn)
    // Expect all filters go back to defaults
    expect(mockOnChange).toHaveBeenCalledWith({
      status: '',
      user_id: undefined,
      per_page: 5,
      page: 1
    })
  })

  it('clear button in Autocomplete triggers clear branch', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    const [clearBtn] = screen.getAllByLabelText('filters.clear_user')
    fireEvent.click(clearBtn)
    // Expect onChange with undefined user_id and reset page
    expect(mockOnChange).toHaveBeenCalledWith({ user_id: undefined, page: 1 })
  })

  it('isOptionEqualToValue returns true when ids match', async () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    // Open the Autocomplete dropdown
    const [openBtn] = screen.getAllByRole('button', { name: 'Open', hidden: false })
    fireEvent.click(openBtn)
    // Select the option for John Doe
    const option = await screen.findByText('John Doe (john@x)')
    fireEvent.click(option)
    // Expect onChange called with that user id
    expect(mockOnChange).toHaveBeenCalledWith({ user_id: 5, page: 1 })
  })

  it('filters and displays options correctly in Autocomplete', async () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)

    // Type "jane" into the combobox
    const userInput = screen.getByRole('combobox', { name: 'filters.user' }) as HTMLInputElement
    fireEvent.change(userInput, { target: { value: 'jane' } })

    // Wait for the filtered options to render
    await waitFor(() => {
      const listbox = screen.getByRole('listbox', { name: 'filters.user' })
      const options = within(listbox).getAllByRole('option')
      expect(options).toHaveLength(3)
      // The options should include "All", John, and Jane
      expect(options.map(o => o.textContent)).toEqual([
        'filters.user_all',
        'John Doe (john@x)',
        'Jane Roe (jane@x)'
      ])
    })
  })

  it('keeps the Drawer mounted in the DOM even when closed', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)

    // The Drawer root should exist even if not visible
    const drawerRoot = document.querySelector('.MuiDrawer-root')
    expect(drawerRoot).not.toBeNull()
  })

  it('opens and closes mobile Drawer via open/onClose', async () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    const menuBtn = screen.getByLabelText('filters.title')
    fireEvent.click(menuBtn)
    // Find the close button inside the opened Drawer
    const drawerClose = screen
      .getAllByLabelText('filters.close')
      .find(el => el.closest('.MuiDrawer-root'))
    expect(drawerClose).toBeTruthy()
    fireEvent.click(drawerClose!)
    // Wait for it to become hidden
    await waitFor(() => {
      expect(drawerClose).not.toBeVisible()
    })
  })

  it('opens mobile Drawer when “open” flag becomes true (keepMounted)', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)

    const drawerRoot = document.querySelector('.MuiDrawer-root')
    expect(drawerRoot).not.toBeNull()

    const paper = drawerRoot!.querySelector('.MuiDrawer-paper')
    expect(paper).not.toBeVisible()

    // Click menu to open
    const menuBtn = screen.getByLabelText('filters.title')
    fireEvent.click(menuBtn)

    expect(paper).toBeVisible()
  })

  it('closes the Drawer when clicking on the backdrop', async () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    // Open Drawer
    const menuBtn = screen.getByLabelText('filters.title')
    fireEvent.click(menuBtn)
    // Ensure backdrop is present
    let backdrop = document.querySelector('.MuiBackdrop-root')
    expect(backdrop).toBeInTheDocument()

    // Click backdrop to close
    fireEvent.click(backdrop!)
    await waitFor(() => {
      expect(backdrop).toHaveStyle('visibility: hidden')
    })
  })

  it('shows a loading spinner when usersLoading is true', () => {
    // Force the hook to return loading
    ;(useUsers as any).mockReturnValue({ users: [], loading: true })
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    // The MUI spinner has role "progressbar"
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('uses allOption when filters.user_id is not in user list', () => {
    // Provide a user_id not present in users[]
    const badFilters = { ...defaultFilters, user_id: 999 }
    render(<AdminTicketsFilters filters={badFilters} onChange={mockOnChange} />)
    // The combobox should show the "all" label
    const userInput = screen.getByRole('combobox', { name: 'filters.user' }) as HTMLInputElement
    expect(userInput.value).toBe('filters.user_all')
  })

  it('displays the matching user when filters.user_id is present', () => {
    // Use Jane Roe's ID
    const goodFilters = { ...defaultFilters, user_id: 6 }
    render(<AdminTicketsFilters filters={goodFilters} onChange={mockOnChange} />)
    const userInput = screen.getByRole('combobox', { name: 'filters.user' }) as HTMLInputElement
    expect(userInput.value).toBe('Jane Roe (jane@x)')
  })

  it('uses the selector passed to useAuthStore to get authToken', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    // Grab the selector function passed to useAuthStore
    const selector = (useAuthStore as unknown as jest.Mock).mock.calls[0][0]
    expect(typeof selector).toBe('function')
    // Check that selector extracts state.authToken
    expect(selector({ authToken: 'mon-token', autre: 42 })).toBe('mon-token')
  })
})
