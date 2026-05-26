import { prisma } from "@/lib/prisma"
import { generateInvoiceNumber } from "@/lib/invoice-number"

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
      clientEmail: order.customer.email,
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
    data: {
      status: "INVOICED",
      invoiceId: invoice.id
    }
  })

  return {
    agent: "Invoice Generation Agent",
    invoiceNumber: invoice.invoiceNumber,
    invoiceId: invoice.id,
    status: "GENERATED",
    message: `Sales invoice ${invoice.invoiceNumber} generated and sent to customer.`
  }
}
