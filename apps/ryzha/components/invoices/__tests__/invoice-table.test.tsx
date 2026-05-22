import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect } from "vitest"
import { InvoiceTable } from "../invoice-table"

// Mock useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe("InvoiceTable", () => {
  const mockInvoices = [
    { id: "1", invoiceNumber: "INV-001", clientName: "Client A", clientEmail: "a@test.com", issueDate: "2024-01-01", total: 100, status: "DRAFT" },
    { id: "2", invoiceNumber: "INV-002", clientName: "Client B", clientEmail: "b@test.com", issueDate: "2024-01-02", total: 200, status: "PAID" },
  ]

  it("renders invoices and filters by search", () => {
    render(<InvoiceTable initialInvoices={mockInvoices} />)

    expect(screen.getByText("INV-001")).toBeDefined()
    expect(screen.getByText("INV-002")).toBeDefined()

    const searchInput = screen.getByPlaceholderText("Search invoices...")
    fireEvent.change(searchInput, { target: { value: "Client A" } })

    expect(screen.getByText("INV-001")).toBeDefined()
    expect(screen.queryByText("INV-002")).toBeNull()
  })

  it("handles bulk selection", () => {
    render(<InvoiceTable initialInvoices={mockInvoices} />)

    const checkboxes = screen.getAllByRole("checkbox")
    // First checkbox is "select all"
    fireEvent.click(checkboxes[1]) // Select first invoice

    expect(screen.getByText("1 selected")).toBeDefined()
    expect(screen.getByText("Mark Paid")).toBeDefined()
  })
})
