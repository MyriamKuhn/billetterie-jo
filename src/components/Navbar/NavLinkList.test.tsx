import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// ─── Stub du module navItems ─────────────────────────────────────────────────
vi.mock('./navItems', () => ({
  __esModule: true,
  navItems: [
    { key: 'home',      href: '/home',      icon: () => <span data-testid="icon-home" />,      group: 'public'    },
    { key: 'about',     href: '/about',     icon: () => <span data-testid="icon-about" />,     group: 'public'    },
    { key: 'login',     href: '/login',     icon: () => <span data-testid="icon-login" />,     group: 'login'     },
    { key: 'signup',    href: '/signup',    icon: () => <span data-testid="icon-signup" />,    group: 'login'     },
    { key: 'forgot',    href: '/forgot',    icon: () => <span data-testid="icon-forgot" />,    group: 'password'  },
    { key: 'dashboard', href: '/dashboard', icon: () => <span data-testid="icon-dashboard" />, group: 'dashboard', role: 'user' },
    { key: 'profile',   href: '/profile',   icon: () => <span data-testid="icon-profile" />,   group: 'auth',      role: 'user' },
    { key: 'logout',    href: '',           icon: () => <span data-testid="icon-logout" />,    group: 'logout'    },
  ],
}))

// ─── Mock react-i18next ─────────────────────────────────────────────────────
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>()
  return {
    __esModule: true,
    ...actual,
    useTranslation: () => ({ t: (k: string) => k }),
  }
})

// ─── Stub ActiveLink ─────────────────────────────────────────────────────────
vi.mock('../ActiveLink', () => ({
  __esModule: true,
  default: ({ to, children, ...p }: any) => (
    <a data-testid="active-link" data-to={to} {...p}>
      {children}
    </a>
  ),
}))

// ─── Mock du helper logout ───────────────────────────────────────────────────
// On crée directement le mock à l’intérieur du factory pour éviter le hoisting
vi.mock('../../utils/authHelper', () => ({
  __esModule: true,
  logout: vi.fn(() => Promise.resolve()),
}))

// ─── Mock des stores ────────────────────────────────────────────────────────
const mockClearToken      = vi.fn()
const mockSetGuestCartId  = vi.fn()
const mockLoadCart        = vi.fn()
vi.mock('../../stores/useAuthStore', () => ({
  __esModule: true,
  useAuthStore: (sel: any) => sel({
    authToken: null,
    role: 'user',
    clearToken: mockClearToken,
    remember: false,
    setToken: () => {},
  }),
}))
vi.mock('../../stores/useCartStore', () => ({
  __esModule: true,
  useCartStore: (sel: any) => sel({
    setGuestCartId: mockSetGuestCartId,
    loadCart: mockLoadCart,
  }),
}))

// ─── Import APRÈS mouture des mocks ─────────────────────────────────────────
import { NavLinkList } from './NavLinkList'
import { navItems }   from './navItems'
import { logout }     from '../../utils/authHelper' // <-- ici on récupère la fn mockée

describe('<NavLinkList />', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('MOBILE non connecté: public + login/signup + forgot', () => {
    const toggle = vi.fn()
    render(
      <MemoryRouter>
        <NavLinkList isMobile toggleDrawer={toggle} />
      </MemoryRouter>
    )

    // public(2)+login(2)+forgot(1)=5
    const links = screen.getAllByTestId('active-link')
    expect(links).toHaveLength(5)

    navItems
      .filter(i => ['public','login','password'].includes(i.group))
      .forEach(item => {
        const a = screen.getByLabelText(`navbar.${item.key}`)
        expect(a).toHaveAttribute('data-to', item.href)
        expect(within(a).getByTestId(`icon-${item.key}`)).toBeInTheDocument()
        fireEvent.click(a)
      })

    expect(toggle).toHaveBeenCalledTimes(5)
  })

  it('MOBILE connecté: public+dashboard+auth puis logout appelé', async () => {
    // Remocker état connecté
    vi.resetModules()
    vi.doMock('../../stores/useAuthStore', () => ({
      __esModule: true,
      useAuthStore: (sel: any) => sel({
        authToken: 'TOK',
        role: 'user',
        clearToken: mockClearToken,
        remember: false,
        setToken: () => {},
      }),
    }))
    vi.doMock('../../stores/useCartStore', () => ({
      __esModule: true,
      useCartStore: (sel: any) => sel({
        setGuestCartId: mockSetGuestCartId,
        loadCart: mockLoadCart,
      }),
    }))
    const { NavLinkList: Reloaded } = await import('./NavLinkList')

    const toggle = vi.fn()
    render(
      <MemoryRouter>
        <Reloaded isMobile toggleDrawer={toggle} />
      </MemoryRouter>
    )

    // public(2) + dashboard(1) + auth(1) = 4 ActiveLink
    const activeLinks = screen.getAllByTestId('active-link')
    expect(activeLinks).toHaveLength(
      navItems.filter(i => ['public','dashboard','auth'].includes(i.group)).length
    )

    // vérifier qu'on voit bien chacun
    navItems
      .filter(i => ['public','dashboard','auth'].includes(i.group))
      .forEach(item => {
        const a = screen.getByLabelText(`navbar.${item.key}`)
        expect(a).toHaveAttribute('data-to', item.href)
        expect(within(a).getByTestId(`icon-${item.key}`)).toBeInTheDocument()
        fireEvent.click(a)
      })

    // Maintenant le bouton Logout
    const logoutBtn = screen.getByLabelText('navbar.logout')
    fireEvent.click(logoutBtn)

    // toggleDrawer doit avoir été appelé sur chacune des 4 ActiveLink + 1 fois sur logout
    expect(toggle).toHaveBeenCalledTimes(5)

    // et logout helper
    await expect(logout).toHaveBeenCalledWith(
      mockClearToken,
      mockSetGuestCartId,
      mockLoadCart,
      expect.any(Function),
      '/login'
    )
  })

  it('DESKTOP: n’affiche que publicItems', () => {
    render(
      <MemoryRouter>
        <NavLinkList isMobile={false} />
      </MemoryRouter>
    )
    const links = screen.getAllByTestId('active-link')
    const pubs  = navItems.filter(i => i.group === 'public')
    expect(links).toHaveLength(pubs.length)
    links.forEach((a,i) => {
      expect(a).toHaveAttribute('data-to', pubs[i].href)
      expect(a).toHaveTextContent(`navbar.${pubs[i].key}`)
    })
  })
})
