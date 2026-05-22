import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect } from "vitest"
import { PDFPreviewModal } from "../pdf-preview-modal"

describe("PDFPreviewModal", () => {
  const mockOnClose = vi.fn()

  it("renders when open", () => {
    render(
      <PDFPreviewModal
        isOpen={true}
        onClose={mockOnClose}
        pdfUrl="/test.pdf"
        invoiceNumber="INV-001"
      />
    )

    expect(screen.getByText("Invoice Preview - INV-001")).toBeDefined()
    expect(screen.getByTitle("Invoice INV-001")).toBeDefined()
  })

  it("calls onClose when close button clicked", () => {
    render(
      <PDFPreviewModal
        isOpen={true}
        onClose={mockOnClose}
        pdfUrl="/test.pdf"
        invoiceNumber="INV-001"
      />
    )

    const closeButton = screen.getByTestId("modal-close-button")
    fireEvent.click(closeButton)
    expect(mockOnClose).toHaveBeenCalled()
  })
})
