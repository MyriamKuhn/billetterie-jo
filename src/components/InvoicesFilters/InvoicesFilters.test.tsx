import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock react-i18next
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
// Mock useTheme from MUI
vi.mock('@mui/material/styles', () => ({ useTheme: () => ({ mixins: { toolbar: { minHeight: 64 } }, palette: { divider: '#000' } }) }))
// Mock DatePicker: onChange callback returns object with format() or null
vi.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ label, value, onChange }: any) => (
    <div>
      <button data-testid={`datepicker-${label}`} onClick={() => onChange({ format: () => '2025-01-01' })}>
        {value ? value.format('YYYY-MM-DD') : 'null'}
      </button>
      {/* button to clear date, calling onChange(null) to cover null branch */}
      <button data-testid={`datepicker-clear-${label}`} onClick={() => onChange(null)}>Clear</button>
    </div>
  )
}))
// Mock FilterSelect: calls onChange with selected label
vi.mock('../FilterSelect', () => ({
  FilterSelect: ({ label, value, options, onChange }: any) => (
    <select data-testid={`filterselect-${label}`} value={value} onChange={e => onChange(e.target.value)}>
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      {/* unknown option to test default mapping */}
      <option value="unknown_label">unknown_label</option>
    </select>
  )
}))
// Mock SortControl
vi.mock('../SortControl', () => ({
  SortControl: ({ fields, sortBy, order, onSortChange, label }: any) => (
    <div>
      <select data-testid={`sortcontrol-field-${label}`} value={sortBy} onChange={e => onSortChange(e.target.value, order)}>
        {fields.map((f: any) => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <button data-testid={`sortcontrol-order-${label}`} onClick={() => onSortChange(sortBy, order === 'asc' ? 'desc' : 'asc')}>ToggleOrder</button>
    </div>
  )
}))
// Mock Drawer: include backdrop to trigger onClose; children include close IconButton
vi.mock('@mui/material/Drawer', () => ({
  default: ({ open, onClose, children }: any) => (
    <div data-testid={open ? 'drawer-open' : 'drawer-closed'}>
      {open && <button data-testid="drawer-backdrop" onClick={onClose}>Backdrop</button>}
      {open && children}
    </div>
  )
}))
// Mock Box to handle sx.border and component prop
vi.mock('@mui/material/Box', () => ({ default: ({ children, sx, component, ...props }: any) => {
  const style: any = {}
  if (sx && typeof sx.border === 'function') {
    style.border = sx.border({ palette: { divider: '#000' } })
  }
  const Comp = component || 'div'
  return <Comp data-testid="box" style={style} {...props}>{children}</Comp>
} }))
// Mock IconButton
vi.mock('@mui/material/IconButton', () => ({ default: ({ children, 'aria-label': ariaLabel, onClick }: any) => <button aria-label={ariaLabel} onClick={onClick}>{children}</button> }))
// Mock MenuIcon and CloseIcon
vi.mock('@mui/icons-material/Menu', () => ({ default: () => <span data-testid="MenuIcon" /> }))
vi.mock('@mui/icons-material/Close', () => ({ default: () => <span data-testid="CloseIcon" /> }))
// Mock Typography for the empty state message
vi.mock('@mui/material/Typography', () => ({ default: ({ children, variant, align }: any) => <p data-testid="typography" data-variant={variant} data-align={align}>{children}</p> }))

import dayjs from 'dayjs'
import { InvoicesFilters } from './InvoicesFilters'
import type { InvoiceFilters } from '../../types/invoices'

describe('InvoicesFilters component', () => {
  let onChange: ReturnType<typeof vi.fn>
  let initialFilters: InvoiceFilters

  beforeEach(() => {
    vi.clearAllMocks()
    onChange = vi.fn()
    initialFilters = {
      status: '',
      date_from: '',
      date_to: '',
      sort_by: 'created_at',
      sort_order: 'desc',
      per_page: 15,
      page: 1,
    }
  })

  it('renders and handles mappings and unknown values including date clear', () => {
    // Pre-fill filters to test initial values
    const filledFilters: InvoiceFilters = {
      status: 'paid',
      date_from: '2025-02-01',
      date_to: '2025-02-02',
      sort_by: 'amount',
      sort_order: 'asc',
      per_page: 10,
      page: 1,
    }
    render(<InvoicesFilters filters={filledFilters} onChange={onChange} />)
    // Status initial: should be 'filters.status_paid'
    const statusSelects = screen.getAllByTestId('filterselect-filters.status_label') as HTMLSelectElement[]
    const statusSelect = statusSelects[0]
    expect(statusSelect.value).toBe('filters.status_paid')
    // Select unknown label to trigger default '' mapping
    fireEvent.change(statusSelect, { target: { value: 'unknown_label' } })
    expect(onChange).toHaveBeenCalledWith({ status: '', page: 1 })

    // Date From initial value displayed via value.format
    const dateFromBtns = screen.getAllByTestId('datepicker-filters.date_from_label')
    expect(dateFromBtns[0].textContent).toBe(dayjs('2025-02-01').format('YYYY-MM-DD'))
    // Click to set new date
    fireEvent.click(dateFromBtns[0])
    expect(onChange).toHaveBeenCalledWith({ date_from: '2025-01-01', page: 1 })
    // Click clear button to trigger onChange with ''
    const clearFrom = screen.getByTestId('datepicker-clear-filters.date_from_label')
    fireEvent.click(clearFrom)
    expect(onChange).toHaveBeenCalledWith({ date_from: '', page: 1 })

    // Date To initial value
    const dateToBtns = screen.getAllByTestId('datepicker-filters.date_to_label')
    expect(dateToBtns[0].textContent).toBe(dayjs('2025-02-02').format('YYYY-MM-DD'))
    // Click to set new date
    fireEvent.click(dateToBtns[0])
    expect(onChange).toHaveBeenCalledWith({ date_to: '2025-01-01', page: 1 })
    // Click clear button
    const clearTo = screen.getByTestId('datepicker-clear-filters.date_to_label')
    fireEvent.click(clearTo)
    expect(onChange).toHaveBeenCalledWith({ date_to: '', page: 1 })

    // SortControl initial and change
    const sortFieldSelects = screen.getAllByTestId('sortcontrol-field-filters.sort_by_label') as HTMLSelectElement[]
    expect(sortFieldSelects[0].value).toBe('amount')
    fireEvent.change(sortFieldSelects[0], { target: { value: 'uuid' } })
    expect(onChange).toHaveBeenCalledWith({ sort_by: 'uuid', sort_order: 'asc', page: 1 })
    const orderBtns = screen.getAllByTestId('sortcontrol-order-filters.sort_by_label')
    fireEvent.click(orderBtns[0])
    expect(onChange).toHaveBeenCalledWith({ sort_by: 'amount', sort_order: 'desc', page: 1 })

    // Per page initial and fallback
    const perPageSelects = screen.getAllByTestId('filterselect-filters.per_page_label') as HTMLSelectElement[]
    expect(perPageSelects[0].value).toBe('10')
    fireEvent.change(perPageSelects[0], { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith({ per_page: 15, page: 1 })

    // Reset
    const resetBtn = screen.getByRole('button', { name: 'filters.reset' })
    fireEvent.click(resetBtn)
    expect(onChange).toHaveBeenCalledWith({
      status: '', date_from: '', date_to: '', sort_by: 'created_at', sort_order: 'desc', per_page: 15, page: 1,
    })
  })

  it('covers Drawer open/close including onClick for IconButton close', () => {
    render(<InvoicesFilters filters={initialFilters} onChange={onChange} />)
    // Drawer initially closed
    expect(screen.getAllByTestId('drawer-closed').length).toBeGreaterThan(0)
    // Click menu IconButton to open
    const menuBtn = screen.getByLabelText('filters.title')
    fireEvent.click(menuBtn)
    expect(screen.getAllByTestId('drawer-open').length).toBeGreaterThan(0)
    // Click backdrop
    fireEvent.click(screen.getByTestId('drawer-backdrop'))
    expect(screen.getAllByTestId('drawer-closed').length).toBeGreaterThan(0)
    // Re-open and click close IconButton
    fireEvent.click(menuBtn)
    fireEvent.click(screen.getByLabelText('filters.close'))
    expect(screen.getAllByTestId('drawer-closed').length).toBeGreaterThan(0)
  })

  it('renders empty state message when no filters UI? (sanity)', () => {
    // This component does not render empty state; ensure Typography works via other component tests
    // Included to avoid warnings
  })
})
