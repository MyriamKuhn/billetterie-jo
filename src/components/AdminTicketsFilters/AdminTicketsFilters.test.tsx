// src/components/AdminTicketsFilters/AdminTicketsFilters.test.tsx
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AdminTicketsFilters } from './AdminTicketsFilters'
import { useUsers } from '../../hooks/useUsers'
import { useAuthStore } from '../../stores/useAuthStore'

// --- Mocks ------------------------------------------------
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

  it('injecte token et params dans useUsers', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    expect(useAuthStore).toHaveBeenCalled()
    expect(useUsers).toHaveBeenCalledWith(
      { firstname: '', lastname: '', email: '', perPage: 1000000000, page: 1 },
      'tok-123',
      'user'
    )
  })

  it('gère le changement de statut via FilterSelect', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    const [statusSelect] = screen.getAllByTestId('filters.status_label') as HTMLSelectElement[]
    expect(statusSelect.value).toBe('filters.status_issued')
    fireEvent.change(statusSelect, { target: { value: 'filters.status_used' } })
    expect(mockOnChange).toHaveBeenCalledWith({ status: 'used', page: 1 })
  })

  it('gère le changement de per_page via FilterSelect', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    const [, perPageSelect] = screen.getAllByTestId('filters.per_page') as HTMLSelectElement[]
    expect(perPageSelect.value).toBe('10')
    fireEvent.change(perPageSelect, { target: { value: '25' } })
    expect(mockOnChange).toHaveBeenCalledWith({ per_page: 25, page: 1 })
  })

  it('réinitialise tous les filtres avec le bouton Reset', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    const [resetBtn] = screen.getAllByText('filters.reset')
    fireEvent.click(resetBtn)
    expect(mockOnChange).toHaveBeenCalledWith({
      status: '',
      user_id: undefined,
      per_page: 5,
      page: 1
    })
  })

  it('clear Autocomplete déclenche branch `reason === "clear"`', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    const [clearBtn] = screen.getAllByLabelText('filters.clear_user')
    fireEvent.click(clearBtn)
    expect(mockOnChange).toHaveBeenCalledWith({ user_id: undefined, page: 1 })
  })

  it('isOptionEqualToValue renvoie vrai quand id identique', async () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    const [openBtn] = screen.getAllByRole('button', { name: 'Open', hidden: false })
    fireEvent.click(openBtn)
    const option = await screen.findByText('John Doe (john@x)')
    fireEvent.click(option)
    expect(mockOnChange).toHaveBeenCalledWith({ user_id: 5, page: 1 })
  })

  it('gère proprement la sélection et le filtrage dans l’Autocomplete', async () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)

    // taper "jane" dans l'input de l'Autocomplete
    const userInput = screen.getByRole('combobox', { name: 'filters.user' }) as HTMLInputElement
    fireEvent.change(userInput, { target: { value: 'jane' } })

    // attendre que le listbox lié soit rendu
    await waitFor(() => {
      const listbox = screen.getByRole('listbox', { name: 'filters.user' })
      const options = within(listbox).getAllByRole('option')
      expect(options).toHaveLength(3)
      expect(options.map(o => o.textContent)).toEqual([
        'filters.user_all',
        'John Doe (john@x)',
        'Jane Roe (jane@x)'
      ])
    })
  })

  it('garde le Drawer monté dans le DOM même lorsqu’il est fermé (keepMounted)', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)

    // Le Drawer doit exister dans le DOM global dès le rendu, même fermé
    const drawerRoot = document.querySelector('.MuiDrawer-root')
    expect(drawerRoot).not.toBeNull()
  })

  it('ouvre et ferme le Drawer mobile via Drawer open/onClose', async () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    const menuBtn = screen.getByLabelText('filters.title')
    fireEvent.click(menuBtn)
    const drawerClose = screen
      .getAllByLabelText('filters.close')
      .find(el => el.closest('.MuiDrawer-root'))
    expect(drawerClose).toBeTruthy()
    fireEvent.click(drawerClose!)
    await waitFor(() => {
      expect(drawerClose).not.toBeVisible()
    })
  })

  it('ouvre le Drawer mobile quand open passe à true (et reste monté grâce à keepMounted)', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)

    // 1) il existe dans le DOM même fermé
    const drawerRoot = document.querySelector('.MuiDrawer-root')
    expect(drawerRoot).not.toBeNull()

    const paper = drawerRoot!.querySelector('.MuiDrawer-paper')
    expect(paper).not.toBeVisible()

    // 2) clic sur le menu ouvre le Drawer
    const menuBtn = screen.getByLabelText('filters.title')
    fireEvent.click(menuBtn)

    // now it's opened
    expect(paper).toBeVisible()
  })

  it('ferme le Drawer quand on clique sur le backdrop', async () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    // Ouvrir le drawer
    const menuBtn = screen.getByLabelText('filters.title')
    fireEvent.click(menuBtn)
    // S'assurer que le backdrop apparaît
    let backdrop = document.querySelector('.MuiBackdrop-root')
    expect(backdrop).toBeInTheDocument()

    // Cliquer sur le backdrop pour fermer
    fireEvent.click(backdrop!)
    // Attendre que le Drawer soit caché (le backdrop devient invisible)
    await waitFor(() => {
      expect(backdrop).toHaveStyle('visibility: hidden')
    })
  })

  it('affiche un spinner de chargement quand usersLoading est vrai', () => {
    // Mock pour forcer loading=true
    ;(useUsers as any).mockReturnValue({ users: [], loading: true })
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    // Le spinner MUI a le rôle "progressbar"
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('utilise allOption quand filters.user_id n’est pas dans les options', () => {
    // Aucun user n'a l'ID 999, on doit retomber sur allOption
    const badFilters = { ...defaultFilters, user_id: 999 }
    render(<AdminTicketsFilters filters={badFilters} onChange={mockOnChange} />)
    // Le combobox doit afficher le label "filters.user_all"
    const userInput = screen.getByRole('combobox', { name: 'filters.user' }) as HTMLInputElement
    expect(userInput.value).toBe('filters.user_all')
  })

  it('affiche bien l’utilisateur correspondant quand filters.user_id est dans la liste', () => {
    // L’ID 6 correspond à Jane Roe
    const goodFilters = { ...defaultFilters, user_id: 6 }
    render(<AdminTicketsFilters filters={goodFilters} onChange={mockOnChange} />)
    const userInput = screen.getByRole('combobox', { name: 'filters.user' }) as HTMLInputElement
    expect(userInput.value).toBe('Jane Roe (jane@x)')
  })

  it('utilise le sélecteur useAuthStore pour récupérer authToken', () => {
    render(<AdminTicketsFilters filters={defaultFilters} onChange={mockOnChange} />)
    // le premier appel à useAuthStore reçoit un sélecteur
    const selector = (useAuthStore as unknown as jest.Mock).mock.calls[0][0]
    expect(typeof selector).toBe('function')
    // et ce sélecteur renvoie bien state.authToken
    expect(selector({ authToken: 'mon-token', autre: 42 })).toBe('mon-token')
  })
})
