import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Stub window.scrollTo pour jsdom
beforeAll(() => {
  window.scrollTo = () => {}
})

beforeEach(() => {
  // Réinitialise le cache des modules et des mocks
  vi.resetModules()
})

async function setup(prefersDark: boolean) {
  let cookieProps: any
  const changeLanguageSpy = vi.fn()

  // Mocks dynamiques
  vi.doMock('@mui/material/useMediaQuery', () => ({
    default: () => prefersDark,
  }))
  vi.doMock('./stores/useLanguageStore', () => ({
    useLanguageStore: (selector: (s: any) => any) => selector({ lang: 'fr' }),
  }))
  vi.doMock('./i18n', () => ({
    default: { language: 'fr', changeLanguage: changeLanguageSpy },
  }))
  vi.doMock('react-i18next', () => ({
    I18nextProvider: ({ children }: any) => <>{children}</>,
    Trans: ({ children }: any) => <>{children}</>,
    useTranslation: () => ({ t: (k: string) => k }),
  }))
  vi.doMock('react-helmet-async', () => ({
    HelmetProvider: ({ children }: any) => <>{children}</>,
  }))
  vi.doMock('react-cookie-consent', () => ({
    default: (props: any) => {
      cookieProps = props
      return (
        <div data-testid="cookie-banner">
          <button data-testid="accept-btn" onClick={props.onAccept}>
            {props.buttonText}
          </button>
          <button data-testid="decline-btn" onClick={props.onDecline}>
            {props.declineButtonText}
          </button>
          <div data-testid="cookie-children">{props.children}</div>
        </div>
      )
    },
  }))
  vi.doMock('./App', () => ({
    default: (props: any) => (
      <div data-testid="app-mock">
        <span data-testid="mode">{props.mode}</span>
        <button data-testid="toggle-btn" onClick={props.toggleMode}>
          toggle
        </button>
      </div>
    ),
  }))

  // Import *après* tous les doMock
  const { Root } = await import('./Root')
  render(<Root />)
  return { cookieProps, changeLanguageSpy }
}

describe('Root', () => {
  it('passe "light" à <App> et inverse bien au clic', async () => {
    const { changeLanguageSpy } = await setup(false)

    // Vérifie changeLanguage
    expect(changeLanguageSpy).toHaveBeenCalledWith('fr')

    // Vérifie le mode initial et le toggle
    const modeEl = screen.getByTestId('mode')
    expect(modeEl).toHaveTextContent('light')
    await userEvent.click(screen.getByTestId('toggle-btn'))
    expect(modeEl).toHaveTextContent('dark')
  })

  it('passe "dark" à <App> et inverse bien au clic', async () => {
    const { changeLanguageSpy } = await setup(true)

    expect(changeLanguageSpy).toHaveBeenCalledWith('fr')

    const modeEl = screen.getByTestId('mode')
    expect(modeEl).toHaveTextContent('dark')
    await userEvent.click(screen.getByTestId('toggle-btn'))
    expect(modeEl).toHaveTextContent('light')
  })

  it('transmet les props correctes à CookieConsent et gère onAccept/onDecline', async () => {
    const { cookieProps } = await setup(false)
    const logSpy = vi.spyOn(console, 'log')

    // Props statiques
    expect(cookieProps.location).toBe('bottom')
    expect(cookieProps.buttonText).toBe('cookieBanner.accept')
    expect(cookieProps.declineButtonText).toBe('cookieBanner.decline')
    expect(cookieProps.enableDeclineButton).toBe(true)
    expect(cookieProps.cookieName).toBe('jo2024_cookie_consent')

    // Handlers
    await userEvent.click(screen.getByTestId('accept-btn'))
    expect(logSpy).toHaveBeenCalledWith('Cookies acceptés')
    await userEvent.click(screen.getByTestId('decline-btn'))
    expect(logSpy).toHaveBeenCalledWith('Cookies refusés')
  })
})
