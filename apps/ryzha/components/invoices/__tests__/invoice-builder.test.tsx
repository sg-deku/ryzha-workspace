import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect } from "vitest"
import { InvoiceBuilder } from "../invoice-builder"

describe("InvoiceBuilder", () => {
  const mockItems = [
    { id: "1", description: "Item 1", quantity: 2, unitPrice: 10, taxRate: 0, amount: 20 },
    { id: "2", description: "Item 2", quantity: 1, unitPrice: 50, taxRate: 0, amount: 50 },
  ]
  const mockSetLineItems = vi.fn()
  const mockOnUpdateItem = vi.fn()
  const mockOnRemoveItem = vi.fn()
  const mockOnCloneItem = vi.fn()

  it("renders line items correctly", () => {
    render(
      <InvoiceBuilder
        lineItems={mockItems}
        setLineItems={mockSetLineItems}
        onUpdateItem={mockOnUpdateItem}
        onRemoveItem={mockOnRemoveItem}
        onCloneItem={mockOnCloneItem}
      />
    )

    expect(screen.getByDisplayValue("Item 1")).toBeDefined()
    expect(screen.getByDisplayValue("Item 2")).toBeDefined()
    expect(screen.getByText("$20.00")).toBeDefined()
    expect(screen.getByText("$50.00")).toBeDefined()
  })

  it("calls onUpdateItem when input changes", () => {
    render(
      <InvoiceBuilder
        lineItems={mockItems}
        setLineItems={mockSetLineItems}
        onUpdateItem={mockOnUpdateItem}
        onRemoveItem={mockOnRemoveItem}
        onCloneItem={mockOnCloneItem}
      />
    )

    const input = screen.getByDisplayValue("Item 1")
    fireEvent.change(input, { target: { value: "Updated Item 1" } })
    expect(mockOnUpdateItem).toHaveBeenCalledWith("1", "description", "Updated Item 1")
  })
})
