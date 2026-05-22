import { render, screen, waitFor } from "@testing-library/react"
import { vi } from "vitest"
import { CashFlowForecast } from "../../../app/dashboard/cashflow-chart"

// Mock ResizeObserver for Recharts
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      dailyForecast: [
        { date: "2023-01-01", balance: 10000 },
        { date: "2023-01-02", balance: 11000 }
      ],
      recurringExpenses: [],
      latePaymentRisks: [],
      insights: []
    }),
  })
) as ReturnType<typeof vi.fn>

describe("CashFlowForecast", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the forecast chart after fetching data", async () => {
    render(<CashFlowForecast />)
    
    // Should show loading state initially or load instantly if mocked
    await waitFor(() => {
      expect(screen.getByTestId("cashflow-chart")).toBeInTheDocument()
    })
  })
})