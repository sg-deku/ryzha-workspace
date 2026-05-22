import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import DashboardPage from '../../../app/dashboard/page'

// Mock components used in DashboardPage
vi.mock('../../../app/dashboard/cashflow-chart', () => ({
  CashFlowForecast: () => <div data-testid="cashflow-forecast" />
}))
vi.mock('../../../app/dashboard/dashboard-alerts', () => ({
  DashboardAlerts: () => <div data-testid="dashboard-alerts" />
}))
vi.mock('../../../components/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />
}))
vi.mock('../../../lib/auth', () => ({
  authOptions: {}
}))
vi.mock('next-auth', () => ({
  getServerSession: () => Promise.resolve({ user: { name: 'Test User', organizationId: '1' } })
}))
vi.mock('../../../lib/prisma', () => ({
  prisma: {
    organization: {
      findUnique: () => Promise.resolve({ onboardingCompleted: true })
    }
  }
}))

describe('Dashboard Responsive Grid', () => {
  it('renders the grid container with correct classes', async () => {
    const Page = await DashboardPage()
    render(Page)
    
    const gridContainer = screen.getByTestId('cashflow-forecast').parentElement?.parentElement
    expect(gridContainer).toHaveClass('grid')
    expect(gridContainer).toHaveClass('grid-cols-1')
    expect(gridContainer).toHaveClass('lg:grid-cols-3')
  })
})
