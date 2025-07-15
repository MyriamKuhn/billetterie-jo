import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminPaymentFilters } from './AdminPaymentFilters'
import type { AdminPaymentFilters as Filters } from '../../types/admin'

// -- Mocks for i18n and MUI theme --------------------------------------------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

vi.mock('@mui/material/styles', () => ({
  useTheme: () => ({
    palette: { divider: '#000' },
    mixins: { toolbar: { minHeight: 64 } }
  })
}))

// -- Simplified MUI component mocks ------------------------------------------
vi.mock('@mui/material/Box',             () => ({ default: ({ children, ...p }: any) => <div data-testid="Box" {...p}>{children}</div> }))
vi.mock('@mui/material/Typography',      () => ({ default: ({ children }: any) => <p>{children}</p> }))
vi.mock('@mui/material/Stack',           () => ({ default: ({ children }: any) => <div>{children}</div> }))
vi.mock('@mui/material/Button',          () => ({ default: ({ children, ...p }: any) => <button {...p}>{children}</button> }))
vi.mock('@mui/material/IconButton',      () => ({ default: ({ children, ...p }: any) => <button {...p}>{children}</button> }))
vi.mock('@mui/material/Drawer',          () => ({ default: ({ open, children, onClose }: any) => open ? <div data-testid="Drawer">{children}<button onClick={onClose}>close</button></div> : null }))
vi.mock('@mui/icons-material/Menu',      () => ({ default: () => <span>☰</span> }))
vi.mock('@mui/icons-material/Close',     () => ({ default: () => <span>×</span> }))

// -- Mocks for our filter field components ----------------------------------
vi.mock('../FilterField', () => ({
  FilterField: ({ label, value, onChange }: any) => (
    <div>
      <label>{label}</label>
      <input
        aria-label={label}
        data-testid="FilterField"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}))

vi.mock('../FilterSelect', () => ({
  FilterSelect: ({ label, options, value, onChange }: any) => (
    <div>
      <label>{label}</label>
      <select
        aria-label={label}
        data-testid={`Select-${label}`}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}))

describe('<AdminPaymentFilters />', () => {
  let filters: Filters
  let onChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    filters = {
      q: 'foo',
      status: 'pending',
      payment_method: 'stripe',
      per_page: 10,
      page: 2,
    }
    onChange = vi.fn()
  })

  it('displays all filters in desktop view', () => {
    render(<AdminPaymentFilters filters={filters} onChange={onChange} />)

    const boxes = screen.getAllByTestId('Box')
    expect(boxes[0]).toBeInTheDocument()

    expect(screen.getByLabelText('filters.name')).toHaveValue('foo')

    expect(screen.getByTestId('Select-filters.status_label')).toHaveValue('filters.status_pending')

    expect(screen.getByTestId('Select-filters.payment_method_label')).toHaveValue('filters.payment_method_stripe')

    expect(screen.getByTestId('Select-filters.per_page')).toHaveValue('10')

    expect(screen.getByText('filters.reset')).toBeInTheDocument()
  })

  it('calls onChange on each field update', () => {
    render(<AdminPaymentFilters filters={filters} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('filters.name'), { target: { value: 'bar' } })
    expect(onChange).toHaveBeenCalledWith({ q: 'bar', page: 1 })

    fireEvent.change(screen.getByTestId('Select-filters.status_label'), { target: { value: 'filters.status_all' } })
    expect(onChange).toHaveBeenCalledWith({ status: '', page: 1 })

    fireEvent.change(screen.getByTestId('Select-filters.payment_method_label'), { target: { value: 'filters.payment_method_paypal' } })
    expect(onChange).toHaveBeenCalledWith({ payment_method: 'paypal', page: 1 })

    fireEvent.change(screen.getByTestId('Select-filters.per_page'), { target: { value: '25' } })
    expect(onChange).toHaveBeenCalledWith({ per_page: 25, page: 1 })
  })

  it('resets all filters when Reset is clicked', () => {
    render(<AdminPaymentFilters filters={filters} onChange={onChange} />)

    fireEvent.click(screen.getByText('filters.reset'))
    expect(onChange).toHaveBeenCalledWith({
      q: '',
      status: '',
      payment_method: '',
      per_page: 5,
      page: 1,
    })
  })

  it('opens and closes the Drawer in mobile view', () => {
    render(<AdminPaymentFilters filters={filters} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'filters.title' }))
    expect(screen.getByTestId('Drawer')).toBeInTheDocument()

    fireEvent.click(screen.getByText('close'))
    expect(screen.queryByTestId('Drawer')).toBeNull()
  })

  it('closes the Drawer when CloseIcon is clicked', () => {
    render(<AdminPaymentFilters filters={filters} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'filters.title' }))
    expect(screen.getByTestId('Drawer')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'filters.close' }))

    expect(screen.queryByTestId('Drawer')).toBeNull()
  })

  it('displays "all" when payment method is unrecognized', () => {
    const badFilters = { ...filters, payment_method: 'applepay' as any }
    render(<AdminPaymentFilters filters={badFilters} onChange={onChange} />)

    // Since 'applepay' isn’t in the known list, the select falls back to the first option
    expect(
      screen.getByTestId('Select-filters.payment_method_label')
    ).toHaveValue('filters.payment_method_')
  })
})
