import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from '../sidebar'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

describe('Sidebar', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<Sidebar />)
    expect(screen.getByText('Ryzha')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('highlights the active route', () => {
    render(<Sidebar />)
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveClass('bg-primary')
  })

  it('toggles collapse state', () => {
    render(<Sidebar />)
    const collapseButton = screen.getByRole('button', { name: /collapse/i })
    
    // Initially not collapsed
    expect(screen.getByText('Ryzha')).toBeInTheDocument()
    
    // Click collapse
    fireEvent.click(collapseButton)
    
    // Check if collapsed (text should be hidden or removed from DOM depending on implementation)
    // In our implementation, we use {!collapsed && <span>Ryzha</span>}
    expect(screen.queryByText('Ryzha')).not.toBeInTheDocument()
    
    // Check localStorage
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true')
  })
})
