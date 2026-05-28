import { prisma } from "@/lib/prisma"
import { generateInvoiceNumber } from "@/lib/invoice-number"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"

export async function runInvoiceGenerationAgent(orderId: string, organizationId: string) {
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId, organizationId },
    include: { customer: true, lineItems: true }
  })

  if (!order) throw new Error("Order not found")

  const invoiceNumber = await generateInvoiceNumber(organizationId)

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      organizationId,
      clientName: order.customer.name,
      clientEmail: order.customer.email ?? "",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: order.totalAmount,
      totalTax: 0,
      total: order.totalAmount,
      status: "SENT",
      lineItems: {
        create: order.lineItems.map(li => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          amount: li.amount,
          taxRate: 0,
        }))
      }
    }
  })

  await prisma.salesOrder.update({
    where: { id: orderId },
    data: { status: "INVOICED", invoiceId: invoice.id },
  })

  const jeLines: Array<{ accountName: string; accountType: string; debit: number; credit: number; description?: string }> = [
    {
      accountName: "Accounts Receivable",
      accountType: "Assets",
      debit: invoice.total,
      credit: 0,
      description: `${invoice.invoiceNumber} – Amount due (${invoice.clientName})`,
    },
  ]

  if (order.lineItems.length > 0) {
    for (const li of order.lineItems) {
      jeLines.push({
        accountName: "Service Revenue",
        accountType: "Revenue",
        debit: 0,
        credit: li.amount,
        description: `${invoice.invoiceNumber} – ${li.description}`,
      })
    }
  } else {
    jeLines.push({
      accountName: "Service Revenue",
      accountType: "Revenue",
      debit: 0,
      credit: invoice.total,
      description: `${invoice.invoiceNumber} – O2C agent invoice`,
    })
  }

  await createSystemJournalEntry({
    organizationId,
    sourceType: "Invoice",
    sourceId: invoice.id,
    reference: invoice.invoiceNumber,
    description: `Invoice issued – ${invoice.clientName}`,
    entryDate: new Date(),
    lines: jeLines,
  }).catch(console.error)

  return {
    agent: "Invoice Generation Agent",
    invoiceNumber: invoice.invoiceNumber,
    invoiceId: invoice.id,
    status: "GENERATED",
    message: `Sales invoice ${invoice.invoiceNumber} generated and sent to customer.`
  }
}
