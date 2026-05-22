import { render, screen, fireEvent } from '@testing-library/react'
import { CommandPalette } from '../command-palette'
import { describe, it, expect, vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('CommandPalette', () => {
  it('opens on Cmd+K shortcut', () => {
    render(<CommandPalette />)
    
    // Should be closed initially
    expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument()
    
    // Simulate Cmd+K
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    
    // Should be open
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument()
  })

  it('filters results', () => {
    render(<CommandPalette />)
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    
    const input = screen.getByPlaceholderText('Type a command or search...')
    fireEvent.change(input, { target: { value: 'invoice' } })
    
    expect(screen.getByText('Invoices')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })
})
