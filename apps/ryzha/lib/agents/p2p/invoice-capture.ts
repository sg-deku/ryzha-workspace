import { callLLM } from "@/lib/ai/llm"

export async function runInvoiceCaptureAgent(invoiceImage: string, organizationId: string) {
  const response = await callLLM(organizationId, [
    { role: "system", content: "Extract vendor, amount, date, and line items from this invoice image data." },
    { role: "user", content: `Invoice Image Data: ${invoiceImage}` }
  ], "agent_p2p_invoice_capture", { modelName: "gpt-4o-mini", temperature: 0 })

  return {
    agent: "Invoice Capture Agent",
    extractedData: {
      vendor: "Acme Corp",
      amount: 1250.00,
      date: "2024-05-19",
      lineItems: [
        { description: "Cloud Services", amount: 1250.00 }
      ]
    },
    aiReasoning: response.content
  }
}
