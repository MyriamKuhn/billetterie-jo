import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminPaymentFilters } from './AdminPaymentFilters'
import type { AdminPaymentFilters as Filters } from '../../types/admin'

// -- Mocks pour i18n et MUI ---------------------------------------------------
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

// -- Mocks simplifiés pour MUI ------------------------------------------------
vi.mock('@mui/material/Box',             () => ({ default: ({ children, ...p }: any) => <div data-testid="Box" {...p}>{children}</div> }))
vi.mock('@mui/material/Typography',      () => ({ default: ({ children }: any) => <p>{children}</p> }))
vi.mock('@mui/material/Stack',           () => ({ default: ({ children }: any) => <div>{children}</div> }))
vi.mock('@mui/material/Button',          () => ({ default: ({ children, ...p }: any) => <button {...p}>{children}</button> }))
vi.mock('@mui/material/IconButton',      () => ({ default: ({ children, ...p }: any) => <button {...p}>{children}</button> }))
vi.mock('@mui/material/Drawer',          () => ({ default: ({ open, children, onClose }: any) => open ? <div data-testid="Drawer">{children}<button onClick={onClose}>close</button></div> : null }))
vi.mock('@mui/icons-material/Menu',      () => ({ default: () => <span>☰</span> }))
vi.mock('@mui/icons-material/Close',     () => ({ default: () => <span>×</span> }))

// -- Mocks de nos composants de filtre ----------------------------------------
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

  it('affiche tous les filtres en version desktop', () => {
    render(<AdminPaymentFilters filters={filters} onChange={onChange} />)

    // Le premier Box est bien l’aside desktop
    const boxes = screen.getAllByTestId('Box')
    expect(boxes[0]).toBeInTheDocument()

    // Filtre texte
    expect(screen.getByLabelText('filters.name')).toHaveValue('foo')

    // Statut
    expect(screen.getByTestId('Select-filters.status_label')).toHaveValue('filters.status_pending')

    // Méthode paiement
    expect(screen.getByTestId('Select-filters.payment_method_label')).toHaveValue('filters.payment_method_stripe')

    // Per page
    expect(screen.getByTestId('Select-filters.per_page')).toHaveValue('10')

    // Bouton reset
    expect(screen.getByText('filters.reset')).toBeInTheDocument()
  })

  it('appelle onChange à chaque modification de champ', () => {
    render(<AdminPaymentFilters filters={filters} onChange={onChange} />)

    // 1. Texte de recherche
    fireEvent.change(screen.getByLabelText('filters.name'), { target: { value: 'bar' } })
    expect(onChange).toHaveBeenCalledWith({ q: 'bar', page: 1 })

    // 2. Statut
    fireEvent.change(screen.getByTestId('Select-filters.status_label'), { target: { value: 'filters.status_all' } })
    expect(onChange).toHaveBeenCalledWith({ status: '', page: 1 })

    // 3. Méthode paiement
    fireEvent.change(screen.getByTestId('Select-filters.payment_method_label'), { target: { value: 'filters.payment_method_paypal' } })
    expect(onChange).toHaveBeenCalledWith({ payment_method: 'paypal', page: 1 })

    // 4. Per page
    fireEvent.change(screen.getByTestId('Select-filters.per_page'), { target: { value: '25' } })
    expect(onChange).toHaveBeenCalledWith({ per_page: 25, page: 1 })
  })

  it('réinitialise tous les filtres sur clic Reset', () => {
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

  it('ouvre et ferme le Drawer en mobile', () => {
    render(<AdminPaymentFilters filters={filters} onChange={onChange} />)

    // Ouvrir
    fireEvent.click(screen.getByRole('button', { name: 'filters.title' }))
    expect(screen.getByTestId('Drawer')).toBeInTheDocument()

    // Fermer
    fireEvent.click(screen.getByText('close'))
    expect(screen.queryByTestId('Drawer')).toBeNull()
  })

  it('ferme le Drawer en cliquant sur le bouton CloseIcon', () => {
    render(<AdminPaymentFilters filters={filters} onChange={onChange} />)

    // 1) Ouvre d’abord le Drawer
    fireEvent.click(screen.getByRole('button', { name: 'filters.title' }))
    expect(screen.getByTestId('Drawer')).toBeInTheDocument()

    // 2) Clique sur le bouton de fermeture (CloseIcon)
    fireEvent.click(screen.getByRole('button', { name: 'filters.close' }))

    // 3) Vérifie que le Drawer a disparu
    expect(screen.queryByTestId('Drawer')).toBeNull()
  })

  it('affiche "all" quand la méthode de paiement n’est pas reconnue', () => {
    const badFilters = { ...filters, payment_method: 'applepay' as any }
    render(<AdminPaymentFilters filters={badFilters} onChange={onChange} />)

    // Comme 'applepay' n'est pas dans ['','paypal','stripe','free'],
    // la valeur du select retombe sur la première option: 'filters.payment_method_'
    expect(
      screen.getByTestId('Select-filters.payment_method_label')
    ).toHaveValue('filters.payment_method_')
  })
})
