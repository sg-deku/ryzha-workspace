import { render, screen } from "@testing-library/react"
import { vi, describe, it, expect } from "vitest"
import { CategoryChart } from "../category-chart"

// Mock Recharts
vi.mock("recharts", async () => {
  const OriginalModule = await vi.importActual("recharts") as any;
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  };
})

describe("CategoryChart", () => {
  const mockData = [
    { name: "Software", value: 100 },
    { name: "Hardware", value: 200 },
  ]

  it("renders with title", () => {
    render(<CategoryChart data={mockData} />)
    expect(screen.getByText("Expense Breakdown")).toBeDefined()
  })
})
