import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect } from "vitest"
import { UploadExpensesForm } from "../upload-form"

// Mock useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock useDropzone
vi.mock("react-dropzone", () => ({
  useDropzone: ({ onDrop }: any) => ({
    getRootProps: () => ({}),
    getInputProps: () => ({ onChange: (e: any) => onDrop(Array.from(e.target.files)) }),
    isDragActive: false,
  }),
}))

describe("UploadExpensesForm", () => {
  it("renders upload zone initially", () => {
    render(<UploadExpensesForm />)
    expect(screen.getByText(/Click or drag CSV here/i)).toBeDefined()
  })

  it("shows mapping and preview after file selection", async () => {
    render(<UploadExpensesForm />)
    const input = screen.getByRole("textbox", { hidden: true }) as HTMLInputElement
    const file = new File(["date,description,amount\n2024-01-01,test,10"], "test.csv", { type: "text/csv" })
    
    // Simulate file selection
    Object.defineProperty(input, 'files', { value: [file] })
    fireEvent.change(input)

    // Wait for FileReader and state updates
    expect(await screen.findByText(/Map your columns/i)).toBeDefined()
    expect(screen.getByText(/Data Preview/i)).toBeDefined()
  })
})
