import { render, screen } from "@testing-library/react"
import { vi, describe, it, expect } from "vitest"
import { AICategorizeProgress } from "../ai-categorize-progress"

describe("AICategorizeProgress", () => {
  it("renders correctly when processing", () => {
    render(
      <AICategorizeProgress
        isProcessing={true}
        totalItems={10}
        processedItems={5}
        onComplete={vi.fn()}
      />
    )

    expect(screen.getByText(/AI Categorization in Progress/i)).toBeDefined()
    expect(screen.getByText(/Processing 5 of 10/i)).toBeDefined()
    expect(screen.getByText("50%")).toBeDefined()
  })

  it("shows complete when finished", () => {
    render(
      <AICategorizeProgress
        isProcessing={true}
        totalItems={10}
        processedItems={10}
        onComplete={vi.fn()}
      />
    )

    expect(screen.getByText(/Complete!/i)).toBeDefined()
  })
})
