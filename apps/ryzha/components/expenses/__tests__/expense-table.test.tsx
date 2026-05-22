import { render, screen } from "@testing-library/react"
import { vi, describe, it, expect } from "vitest"
import { ExpenseTable } from "../expense-table"

// Mock useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

// Mock virtuoso because it's hard to test in JSDOM
vi.mock("react-virtuoso", () => ({
  TableVirtuoso: ({ data, itemContent, fixedHeaderContent }: any) => (
    <table>
      <thead>{fixedHeaderContent()}</thead>
      <tbody>
        {data.map((item: any, index: number) => (
          <tr key={item.id}>{itemContent(index, item)}</tr>
        ))}
      </tbody>
    </table>
  ),
}))

describe("ExpenseTable", () => {
  const mockExpenses = [
    { id: "1", date: "2024-01-01", description: "Expense 1", amount: 10, category: "Software", status: "PENDING" },
    { id: "2", date: "2024-01-02", description: "Expense 2", amount: 20, category: "Hardware", status: "CATEGORIZED" },
  ]

  it("renders expense data correctly", () => {
    render(<ExpenseTable initialExpenses={mockExpenses} />)
    expect(screen.getByText("Expense 1")).toBeDefined()
    expect(screen.getByText("Expense 2")).toBeDefined()
    expect(screen.getByText("$10.00")).toBeDefined()
  })
})
