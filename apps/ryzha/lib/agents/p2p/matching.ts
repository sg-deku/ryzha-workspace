import { prisma } from "@/lib/prisma"

export async function runMatchingAgent(vendorInvoiceId: string) {
  const invoice = await prisma.vendorInvoice.findUnique({
    where: { id: vendorInvoiceId },
    include: { 
      organization: { include: { p2pSettings: true } },
      purchaseOrder: { include: { lineItems: true } },
      lineItems: true
    }
  })

  if (!invoice) return null

  const settings = invoice.organization.p2pSettings
  const requireThreeWayMatch = settings?.requireThreeWayMatch ?? true

  let status = "MATCHED"
  let logMessage = "Matching Agent: Invoice matched successfully."

  if (invoice.purchaseOrderId) {
    const po = invoice.purchaseOrder
    if (po) {
      // 2-way match: Invoice Total vs PO Total
      const diff = Math.abs(invoice.amount - po.totalAmount)
      if (diff > 0.01) {
        status = "DISPUTED"
        logMessage = `Matching Agent: Total mismatch. Invoice: $${invoice.amount}, PO: $${po.totalAmount}.`
      }

      // 3-way match: Line items check (Receiving is mocked as quantity on PO lines for now)
      if (requireThreeWayMatch && status === "MATCHED") {
        // Simplified check: line item descriptions and quantities
        for (const invLine of invoice.lineItems) {
          const poLine = po.lineItems.find(l => 
            l.description.toLowerCase().includes(invLine.description.toLowerCase())
          )
          if (!poLine) {
            status = "DISPUTED"
            logMessage = `Matching Agent: Line item mismatch. "${invLine.description}" not found in PO.`
            break
          }
          if (invLine.quantity > poLine.quantity) {
            status = "DISPUTED"
            logMessage = `Matching Agent: Quantity mismatch. Invoice: ${invLine.quantity}, PO: ${poLine.quantity}.`
            break
          }
        }
      }
    }
  } else {
    status = "DISPUTED"
    logMessage = "Matching Agent: No Purchase Order found. Invoice flagged as DISPUTED — manual approval required."
  }

  if (status === "MATCHED" && invoice.dueDate && new Date(invoice.dueDate) < new Date()) {
    const daysOverdue = Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    logMessage = `${logMessage} WARNING: Invoice is ${daysOverdue} day(s) overdue (due ${new Date(invoice.dueDate).toLocaleDateString()}) — expedite payment approval.`
  }

  const updated = await prisma.vendorInvoice.update({
    where: { id: vendorInvoiceId },
    data: { status }
  })

  return { updated, logMessage }
}
