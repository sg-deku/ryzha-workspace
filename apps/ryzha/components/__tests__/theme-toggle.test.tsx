import { render, screen } from '@testing-library/react'
import { ThemeToggle } from '../theme-toggle'
import { describe, it, expect, vi } from 'vitest'

// Mock Radix UI DropdownMenu
vi.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Trigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Item: ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => (
    <div onClick={onClick}>{children}</div>
  ),
  Portal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Group: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Sub: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SubTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SubContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Separator: () => <hr />,
  Label: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadioGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadioItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CheckboxItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ItemIndicator: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('ThemeToggle', () => {
  it('renders correctly', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
