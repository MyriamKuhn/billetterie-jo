import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// 1️⃣ Mocks de react-router-dom pour useParams & useNavigate
const mockUseParams = vi.fn()
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}))

// 2️⃣ Mock de react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key // on retourne la clé pour assertion
  })
}))

// 3️⃣ Mocks pour les composants enfants
vi.mock('../components/Seo', () => ({
  __esModule: true,
  default: ({ title, description }: any) => (
    <div data-testid="seo" data-title={title} data-desc={description} />
  )
}))
vi.mock('../components/PageWrapper', () => ({
  __esModule: true,
  PageWrapper: ({ children }: any) => <div data-testid="wrapper">{children}</div>
}))

import VerificationResultPage from './VerificationResultPage'

describe('VerificationResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const cases: Array<{
    key: string
    params: string
    expectedTitle: string
    expectedMessage: string
    expectedLabel: string
    expectedNav: string
  }> = [
    {
      key: 'success',
      params: 'success',
      expectedTitle: 'success.title',
      expectedMessage: 'success.message',
      expectedLabel: 'loginLink',
      expectedNav: '/login'
    },
    {
      key: 'invalid',
      params: 'invalid',
      expectedTitle: 'invalid.title',
      expectedMessage: 'invalid.message',
      expectedLabel: 'loginLink',
      expectedNav: '/login'
    },
    {
      key: 'already-verified',
      params: 'already-verified',
      expectedTitle: 'alreadyVerified.title',
      expectedMessage: 'alreadyVerified.message',
      expectedLabel: 'loginLink',
      expectedNav: '/login'
    },
    {
      key: 'unknown',
      params: 'foobar',
      expectedTitle: 'verification:error.title',
      expectedMessage: 'verification:error.message',
      expectedLabel: 'homeButton',
      expectedNav: '/'
    }
  ]

  cases.forEach(({ key, params, expectedTitle, expectedMessage, expectedLabel, expectedNav }) => {
    it(`affiche correctement le cas "${key}"`, () => {
      mockUseParams.mockReturnValue({ status: params })
      render(<VerificationResultPage />)

      // Seo reçoit toujours seo.title / seo.description
      const seo = screen.getByTestId('seo')
      expect(seo).toHaveAttribute('data-title', 'seo.title')
      expect(seo).toHaveAttribute('data-desc', 'seo.description')

      // Titre et message
      expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(expectedTitle)
      expect(screen.getByText(expectedMessage)).toBeInTheDocument()

      // Bouton avec bon label
      const btn = screen.getByRole('button', { name: expectedLabel })
      expect(btn).toBeInTheDocument()

      // Clique navigue vers la bonne route
      fireEvent.click(btn)
      expect(mockNavigate).toHaveBeenCalledWith(expectedNav)
    })
  })
})
