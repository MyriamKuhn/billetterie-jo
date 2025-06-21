import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import dayjs from 'dayjs'

// Mock useTranslation
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
// Mock useTheme
vi.mock('@mui/material/styles', () => ({ useTheme: () => ({ mixins: { toolbar: { minHeight: 64 } }, palette: { divider: 'dividerColor' } }) }))
// Mock MUI components
vi.mock('@mui/material/Box', () => ({ default: ({ children, ...props }: any) => <div data-testid="Box" {...props}>{children}</div> }))
vi.mock('@mui/material/Typography', () => ({ default: ({ children, ...props }: any) => <p data-testid="Typography" {...props}>{children}</p> }))
vi.mock('@mui/material/Stack', () => ({ default: ({ children, ...props }: any) => <div data-testid="Stack" {...props}>{children}</div> }))
vi.mock('@mui/material/Button', () => ({ default: ({ children, onClick, ...props }: any) => <button data-testid="Button" onClick={onClick} {...props}>{children}</button> }))
vi.mock('@mui/material/IconButton', () => ({ default: ({ children, onClick, 'aria-label': ariaLabel }: any) => <button data-testid="IconButton" aria-label={ariaLabel} onClick={onClick}>{children}</button> }))
vi.mock('@mui/material/Drawer', () => ({ default: ({ children, open }: any) => (
  <div data-testid="Drawer">
    {open ? <div data-testid="DrawerContent">{children}</div> : null}
  </div>
) }))
// Mock icons
vi.mock('@mui/icons-material/Menu', () => ({ default: () => <span data-testid="MenuIcon" /> }))
vi.mock('@mui/icons-material/Close', () => ({ default: () => <span data-testid="CloseIcon" /> }))

// Mock DatePicker
vi.mock('@mui/x-date-pickers/DatePicker', () => ({ DatePicker: ({ label, onChange }: any) => (
  <button data-testid={`datepicker-${label}`} onClick={() => onChange(dayjs('2025-01-02'))}>
    {label}
  </button>
) }))
// Mock FilterSelect
vi.mock('../FilterSelect', () => ({ FilterSelect: ({ label, value, options, onChange }: any) => (
  <select data-testid={`filterselect-${label}`} value={value} onChange={e => onChange(e.target.value)}>
    {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
  </select>
) }))

import { TicketsFilters } from './TicketsFilters'
import type { TicketFilters } from '../../types/tickets'

describe('TicketsFilters', () => {
  let filters: TicketFilters
  let onChange: Mock

  beforeEach(() => {
    filters = { status: '', event_date_from: '', event_date_to: '', per_page: 5, page: 1 }
    onChange = vi.fn()
  })

  it('renders desktop filters and triggers onChange correctly', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />)
    // Status FilterSelect should show 'filters.status_all' initially
    const statusSelect = screen.getByTestId('filterselect-filters.status_label') as HTMLSelectElement
    expect(statusSelect.value).toBe('filters.status_all')
    // Change status to issued
    fireEvent.change(statusSelect, { target: { value: 'filters.status_issued' } })
    expect(onChange).toHaveBeenCalledWith({ status: 'issued', page: 1 })
    // Date from
    const dateFromBtn = screen.getByTestId('datepicker-filters.event_date_from')
    fireEvent.click(dateFromBtn)
    expect(onChange).toHaveBeenCalledWith({ event_date_from: '2025-01-02', page: 1 })
    // Date to
    const dateToBtn = screen.getByTestId('datepicker-filters.event_date_to')
    fireEvent.click(dateToBtn)
    expect(onChange).toHaveBeenCalledWith({ event_date_to: '2025-01-02', page: 1 })
    // Per page
    const perPageSelect = screen.getByTestId('filterselect-filters.per_page') as HTMLSelectElement
    expect(perPageSelect.value).toBe('5')
    fireEvent.change(perPageSelect, { target: { value: '10' } })
    expect(onChange).toHaveBeenCalledWith({ per_page: 10, page: 1 })
    // Reset button
    const resetBtn = screen.getByText('filters.reset')
    fireEvent.click(resetBtn)
    expect(onChange).toHaveBeenCalledWith({ status: '', event_date_from: '', event_date_to: '', per_page: 5, page: 1 })
  })

  it('opens and closes mobile Drawer correctly', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />)
    // Drawer closed initially: DrawerContent not in DOM
    expect(screen.queryByTestId('DrawerContent')).toBeNull()
    // Click menu button
    const menuBtn = screen.getByLabelText('filters.title')
    fireEvent.click(menuBtn)
    // Drawer should open
    expect(screen.getByTestId('DrawerContent')).toBeInTheDocument()
    // Click close button inside Drawer
    const closeBtn = screen.getByLabelText('filters.close')
    fireEvent.click(closeBtn)
    expect(screen.queryByTestId('DrawerContent')).toBeNull()
  })
})
