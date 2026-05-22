import { render, screen, waitFor } from "@testing-library/react"
import { vi } from "vitest"
import { ActivityFeed } from "../activity-feed"

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      { id: "1", type: "invoice", description: "Test Invoice", timestamp: new Date().toISOString(), link: "/invoices" }
    ]),
  })
) as ReturnType<typeof vi.fn>

describe("ActivityFeed", () => {
  it("renders activities after fetching", async () => {
    render(<ActivityFeed />)
    
    await waitFor(() => {
      expect(screen.getByText("Test Invoice")).toBeInTheDocument()
    })
  })
})