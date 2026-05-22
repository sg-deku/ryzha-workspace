import { prisma } from "./prisma"

export async function generateInvoiceNumber(orgId: string): Promise<string> {
  // Simple: get last invoice for org, increment. For MVP.
  const lastInvoice = await prisma.invoice.findFirst({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" }
  })
  
  let num = 1
  if (lastInvoice) {
    const match = lastInvoice.invoiceNumber.match(/\d+$/)
    if (match) num = parseInt(match[0]) + 1
  }
  
  return `INV-${new Date().getFullYear()}-${num.toString().padStart(4, "0")}`
}
