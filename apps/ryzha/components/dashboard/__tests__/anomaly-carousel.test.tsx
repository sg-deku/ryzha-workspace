import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import { AnomalyCarousel } from "../anomaly-carousel"

global.fetch = vi.fn((url) => {
  if (url === "/api/expenses/alert") {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        { id: "1", expense: { vendor: "Stripe", amount: 5000 }, reason: "High amount" }
      ]),
    })
  }
  return Promise.resolve({ ok: true })
}) as ReturnType<typeof vi.fn>

describe("AnomalyCarousel", () => {
  it("renders anomalies and allows dismissal", async () => {
    render(<AnomalyCarousel />)
    
    await waitFor(() => {
      expect(screen.getByText(/Stripe/i)).toBeInTheDocument()
    })
    
    const dismissBtn = screen.getByRole("button", { name: /Dismiss/i })
    await userEvent.click(dismissBtn)
    
    // The anomaly should be removed from the view
    expect(screen.queryByText(/Stripe/i)).not.toBeInTheDocument()
  })
})