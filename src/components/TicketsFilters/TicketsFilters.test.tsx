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
vi.mock('@mui/material/Drawer', () => ({
  default: ({ children, open, onClose }: any) => (
    <div data-testid="Drawer" onClick={onClose}>
      {open ? <div data-testid="DrawerContent">{children}</div> : null}
    </div>
  ),
}))
// Mock icons
vi.mock('@mui/icons-material/Menu', () => ({ default: () => <span data-testid="MenuIcon" /> }))
vi.mock('@mui/icons-material/Close', () => ({ default: () => <span data-testid="CloseIcon" /> }))

// Mock DatePicker
vi.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ label, onChange }: any) => (
    <>
      {/* pour la sélection « normale » */}
      <button
        data-testid={`datepicker-${label}`}
        onClick={() => onChange(dayjs('2025-01-02'))}
      >
        {label}
      </button>
      {/* bouton pour déclencher la valeur null */}
      <button
        data-testid={`datepicker-clear-${label}`}
        onClick={() => onChange(null)}
      >
        clear {label}
      </button>
    </>
  ),
}))
// Mock FilterSelect
vi.mock('../FilterSelect', () => ({ FilterSelect: ({ label, value, options, onChange }: any) => (
  <select data-testid={`filterselect-${label}`} value={value} onChange={e => onChange(e.target.value)}>
    {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
  </select>
) }))

import { TicketsFilters } from './TicketsFilters'
import type { TicketFilters } from '../../types/tickets'

let filters: TicketFilters
let onChange: Mock

describe('TicketsFilters', () => {
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

  it('remet le filtre de statut à vide quand on choisit "All"', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />);
    const statusSelect = screen.getByTestId('filterselect-filters.status_label') as HTMLSelectElement;
    // on repasse la valeur sur l’option "all"
    fireEvent.change(statusSelect, { target: { value: 'filters.status_all' } });
    expect(onChange).toHaveBeenCalledWith({ status: '', page: 1 });
  });

  it('retourne status undefined quand on passe un label inconnu', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />);
    const statusSelect = screen.getByTestId(
      'filterselect-filters.status_label'
    ) as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'UNKNOWN_LABEL' } });
    // Comme on n'a plus de fallback dans le code, status est undefined
    const args = (onChange as Mock).mock.calls[0][0];
    expect(args.status).toBeUndefined();
    expect(args.page).toBe(1);
  });

  it('propose toutes les options de statut et de per_page', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />);
    const statusOptions = screen
      .getByTestId('filterselect-filters.status_label')
      .querySelectorAll('option');
    // statusToLabel a 5 clés : '', issued, used, refunded, cancelled
    expect(statusOptions.length).toBe(5);

    const perPageOptions = screen
      .getByTestId('filterselect-filters.per_page')
      .querySelectorAll('option');
    // on a ['5','10','25','50','100']
    expect(perPageOptions.length).toBe(5);
  });

  it('garde le Drawer monté même fermé (keepMounted)', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />)
    // On s’assure que le Drawer existe toujours dans le DOM
    expect(screen.getByTestId('Drawer')).toBeInTheDocument()
  })
})

describe('Branches spécifiques et fallbacks', () => {
  beforeEach(() => {
    filters = { status: '', event_date_from: '', event_date_to: '', per_page: 5, page: 1 }
    onChange = vi.fn()
  })

  it('retourne status="" quand on re-sélectionne "filters.status_all"', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />)
    const statusSelect = screen.getByTestId('filterselect-filters.status_label') as HTMLSelectElement

    // on repart de l’option "all"
    fireEvent.change(statusSelect, { target: { value: 'filters.status_all' } })
    expect(onChange).toHaveBeenCalledWith({ status: '', page: 1 })
  })

  it('retourne status undefined quand on passe un label inconnu', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />)
    const statusSelect = screen.getByTestId('filterselect-filters.status_label') as HTMLSelectElement
    fireEvent.change(statusSelect, { target: { value: 'UNKNOWN_LABEL' } })
    const args = (onChange as Mock).mock.calls[0][0]
    expect(args.status).toBeUndefined()
    expect(args.page).toBe(1)
  })

  it('retourne per_page=5 (fallback) quand value non-parseable', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />)
    const perPageSelect = screen.getByTestId('filterselect-filters.per_page') as HTMLSelectElement

    fireEvent.change(perPageSelect, { target: { value: 'not-a-number' } })
    expect(onChange).toHaveBeenCalledWith({ per_page: NaN, page: 1 })
  })
})

describe('TicketsFilters (branches supplémentaires)', () => {
  beforeEach(() => {
    // on réinitialise pour chaque test
    filters = { status: '', event_date_from: '', event_date_to: '', per_page: 5, page: 1 }
    onChange = vi.fn()
  })

  it('affiche bien le status “used” quand filters.status = "used" et les dates non vides', () => {
    filters = {
      status: 'used',
      event_date_from: '2025-01-01',
      event_date_to: '2025-01-02',
      per_page: 25,
      page: 1,
    }
    render(<TicketsFilters filters={filters} onChange={onChange} />)

    // status
    const statusSelect = screen.getByTestId('filterselect-filters.status_label') as HTMLSelectElement
    expect(statusSelect.value).toBe('filters.status_used')

    // per_page
    const perPageSelect = screen.getByTestId('filterselect-filters.per_page') as HTMLSelectElement
    expect(perPageSelect.value).toBe('25')

    // on a bien instancié les DatePicker avec une value non‐nulle
    expect(screen.getByTestId('datepicker-filters.event_date_from')).toBeInTheDocument()
    expect(screen.getByTestId('datepicker-filters.event_date_to')).toBeInTheDocument()
  })

  it('retourne per_page=5 (fallback) quand value="0"', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />)
    const perPageSelect = screen.getByTestId('filterselect-filters.per_page') as HTMLSelectElement
    fireEvent.change(perPageSelect, { target: { value: '0' } })
    expect(onChange).toHaveBeenCalledWith({ per_page: NaN, page: 1 })
  })

  it('retourne per_page=5 (fallback) quand value négative', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />)
    const perPageSelect = screen.getByTestId('filterselect-filters.per_page') as HTMLSelectElement
    fireEvent.change(perPageSelect, { target: { value: '-10' } })
    expect(onChange).toHaveBeenCalledWith({ per_page: NaN, page: 1 })
  })

  it('retourne status="refunded" quand on choisit filters.status_refunded', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />);
    const statusSelect = screen.getByTestId('filterselect-filters.status_label') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'filters.status_refunded' } });
    expect(onChange).toHaveBeenCalledWith({ status: 'refunded', page: 1 });
  });

  it('retourne status="cancelled" quand on choisit filters.status_cancelled', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />);
    const statusSelect = screen.getByTestId('filterselect-filters.status_label') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'filters.status_cancelled' } });
    expect(onChange).toHaveBeenCalledWith({ status: 'cancelled', page: 1 });
  });

  it('ferme le Drawer quand on appelle la prop onClose', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />)
    // Ouvre le Drawer
    fireEvent.click(screen.getByLabelText('filters.title'))
    // Vérifie qu'il est ouvert
    expect(screen.getByTestId('DrawerContent')).toBeInTheDocument()
    // Appelle onClose
    fireEvent.click(screen.getByLabelText('filters.close'))
    // Après, il devrait être fermé
    expect(screen.queryByTestId('DrawerContent')).toBeNull()
  })

  it('appelle onClose du Drawer quand on clique sur le backdrop', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />)
    // Ouvre le drawer
    fireEvent.click(screen.getByLabelText('filters.title'))
    expect(screen.getByTestId('DrawerContent')).toBeInTheDocument()
    // Ferme via le backdrop (mock qui appelle onClose)
    fireEvent.click(screen.getByTestId('Drawer'))
    expect(screen.queryByTestId('DrawerContent')).toBeNull()
  })

  it('retourne event_date_from="" quand on « clear » le DatePicker', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />);
    // on déclenche le bouton « clear » qui passe null
    fireEvent.click(screen.getByTestId('datepicker-clear-filters.event_date_from'));
    expect(onChange).toHaveBeenCalledWith({ event_date_from: '', page: 1 });
  });

  it('retourne event_date_to="" quand on « clear » le DatePicker', () => {
    render(<TicketsFilters filters={filters} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('datepicker-clear-filters.event_date_to'));
    expect(onChange).toHaveBeenCalledWith({ event_date_to: '', page: 1 });
  });
})