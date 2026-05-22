import { render, screen } from '@testing-library/react'
import { BottomNav } from '../bottom-nav'
import { describe, it, expect, vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

describe('BottomNav', () => {
  it('renders correctly', () => {
    render(<BottomNav />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Invoices')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('highlights the active route', () => {
    render(<BottomNav />)
    const homeLink = screen.getByText('Home').parentElement
    expect(homeLink).toHaveClass('text-primary')
  })
})
