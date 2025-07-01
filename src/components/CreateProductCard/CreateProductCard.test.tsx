import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CreateProductCard } from './CreateProductCard'

// 1) Mock useTranslation to return the key as text
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

describe('<CreateProductCard />', () => {
  const onCreate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title, intro, and button text from translation keys', () => {
    render(<CreateProductCard onCreate={onCreate} />)

    // The Typography h6 should render 'products.create_new'
    expect(screen.getByText('products.create_new')).toBeInTheDocument()

    // The body2 text should render 'products.create_intro'
    expect(screen.getByText('products.create_intro')).toBeInTheDocument()

    // The button should render 'products.create_button'
    expect(screen.getByRole('button', { name: 'products.create_button' }))
      .toBeInTheDocument()
  })

  it('calls onCreate when the button is clicked', async () => {
    render(<CreateProductCard onCreate={onCreate} />)

    const button = screen.getByRole('button', { name: 'products.create_button' })
    await userEvent.click(button)

    expect(onCreate).toHaveBeenCalledOnce()
  })
})
