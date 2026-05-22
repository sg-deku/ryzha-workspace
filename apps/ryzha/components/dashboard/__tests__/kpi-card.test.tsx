import { render, screen } from "@testing-library/react"
import { KPICard } from "../kpi-card"

// Mock ResizeObserver for Recharts
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock

describe("KPICard", () => {
  it("renders value, change, and sparkline", () => {
    render(
      <KPICard
        title="Test KPI"
        value="$1,234"
        change="+5%"
        data={[1, 2, 3]}
        index={0}
      />
    )

    expect(screen.getByText("Test KPI")).toBeInTheDocument()
    expect(screen.getByText("$1,234")).toBeInTheDocument()
    expect(screen.getByText("+5% from last month")).toBeInTheDocument()
    expect(screen.getByTestId("sparkline")).toBeInTheDocument()
  })
})