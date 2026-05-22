import { render, screen, fireEvent, act } from "@testing-library/react"
import { vi, describe, it, expect } from "vitest"
import { InvoiceForm } from "../invoice-form"

// Mock useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock fetch
global.fetch = vi.fn()

describe("InvoiceForm AI Suggest", () => {
  it("simulates AI suggest click", async () => {
    const mockSuggestions = [
      { description: "AI Item", suggestedQuantity: 1, suggestedUnitPrice: 100, recommendedTaxRate: 19 }
    ]
    
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nextNumber: "INV-001", defaultTaxRate: 0 })
    })

    await act(async () => {
      render(<InvoiceForm />)
    })

    const aiInput = screen.getByPlaceholderText(/e.g. 10 hours/i)
    fireEvent.change(aiInput, { target: { value: "test" } })

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuggestions
    })

    const suggestButton = screen.getByText("Suggest Items")
    await act(async () => {
      fireEvent.click(suggestButton)
    })

    // Check that suggested item appeared
    expect(await screen.findByDisplayValue("AI Item")).toBeDefined()
  })
})
