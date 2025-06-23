import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useTheme to provide a known palette
vi.mock('@mui/material/styles', () => ({
  useTheme: () => ({ palette: { action: { hover: 'testHoverColor' } } }),
}))

// Mock MUI components used in TicketCardSkeleton
vi.mock('@mui/material/Box', () => ({ default: ({ children, ...props }: any) => <div data-testid="Box" {...props}>{children}</div> }))
vi.mock('@mui/material/Card', () => ({ default: ({ children, ...props }: any) => <div data-testid="Card" {...props}>{children}</div> }))
vi.mock('@mui/material/CardContent', () => ({ default: ({ children, ...props }: any) => <div data-testid="CardContent" {...props}>{children}</div> }))
// Mock Skeleton to capture props
vi.mock('@mui/material/Skeleton', () => ({
  default: ({ variant, width, height, sx }: any) => {
    // Render a div capturing props for assertion
    const dataAttrs: any = { 'data-testid': 'Skeleton' }
    if (variant) dataAttrs['data-variant'] = variant
    if (width !== undefined) dataAttrs['data-width'] = typeof width === 'number' ? width : JSON.stringify(width)
    if (height !== undefined) dataAttrs['data-height'] = typeof height === 'number' ? height : JSON.stringify(height)
    if (sx && sx.bgcolor) dataAttrs['data-bgcolor'] = sx.bgcolor
    return <div {...dataAttrs} />
  }
}))

import { TicketCardSkeleton } from './TicketCardSkeleton'

describe('TicketCardSkeleton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correct number of Skeletons with expected props', () => {
    render(<TicketCardSkeleton />)
    // There should be 9 Skeleton elements:
    // 1 QR skeleton, 1 title, 1 token space, 2 date/lieu lines, 1 places, 1 chip placeholder, 2 action buttons
    const skeletons = screen.getAllByTestId('Skeleton')
    expect(skeletons.length).toBe(9)

    // Check first Skeleton (QR zone) has variant="rectangular" and bgcolor from theme
    const first = skeletons[0]
    expect(first).toHaveAttribute('data-variant', 'rectangular')
    // bgcolor should match mocked theme.palette.action.hover
    expect(first).toHaveAttribute('data-bgcolor', 'testHoverColor')

    // Check title skeleton: variant="text" width="60%" height={32}
    // Find one with data-variant="text" and data-width including "60%" and data-height="32"
    const titleSkeleton = skeletons.find(el => el.getAttribute('data-variant') === 'text' && el.getAttribute('data-width')?.includes('60%') && el.getAttribute('data-height') === '32')
    expect(titleSkeleton).toBeDefined()

    // Check token space skeleton: variant="text" width="40%"
    const tokenSkeleton = skeletons.find(el => el.getAttribute('data-variant') === 'text' && el.getAttribute('data-width')?.includes('40%'))
    expect(tokenSkeleton).toBeDefined()

    // Check date/lieu skeletons: variant="text", widths "50%" and "70%"
    const dateSkeleton50 = skeletons.find(el => el.getAttribute('data-variant') === 'text' && el.getAttribute('data-width')?.includes('50%'))
    const dateSkeleton70 = skeletons.find(el => el.getAttribute('data-variant') === 'text' && el.getAttribute('data-width')?.includes('70%'))
    expect(dateSkeleton50).toBeDefined()
    expect(dateSkeleton70).toBeDefined()

    // Check places skeleton: variant="text" width="30%"
    const placesSkeleton = skeletons.find(el => el.getAttribute('data-variant') === 'text' && el.getAttribute('data-width')?.includes('30%'))
    expect(placesSkeleton).toBeDefined()

    // Check chip placeholder: variant="rectangular" width=80 height=24
    const chipPlaceholder = skeletons.find(el => el.getAttribute('data-variant') === 'rectangular' && el.getAttribute('data-width') === '80' && el.getAttribute('data-height') === '24')
    expect(chipPlaceholder).toBeDefined()

    // Check action button skeletons: two variant="rectangular" width=120 height=36
    const actionSkeletons = skeletons.filter(el => el.getAttribute('data-variant') === 'rectangular' && el.getAttribute('data-width') === '120' && el.getAttribute('data-height') === '36')
    expect(actionSkeletons.length).toBe(2)
  })
})
