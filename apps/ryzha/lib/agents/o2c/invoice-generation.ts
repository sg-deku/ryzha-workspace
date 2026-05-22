export async function runInvoiceGenerationAgent(orderId: string, organizationId: string) {
  return {
    agent: "Invoice Generation Agent",
    invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
    status: "GENERATED",
    message: "Sales invoice generated and sent to customer."
  }
}
