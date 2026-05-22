import { prisma } from "@/lib/prisma"

export async function runPaymentSchedulerAgent(invoiceId: string, organizationId: string) {
  // Epic 4.1: Connect P2P to Financial Engine
  // When a payment is scheduled/processed, we should create an Expense.
  
  // Mocking a successful payment processing
  const amount = 1250.00
  const vendorName = "Acme Corp"

  // In a real scenario, we'd find the invoice first
  // const invoice = await prisma.vendorInvoice.findUnique({ where: { id: invoiceId } })

  // Create Expense in the financial engine
  try {
    const expense = await prisma.expense.create({
      data: {
        amount,
        description: `Payment to ${vendorName} (Invoice: ${invoiceId})`,
        category: "Software",
        date: new Date(),
        organizationId,
        status: "PAID"
      }
    })

    return {
      agent: "Payment Scheduler Agent",
      status: "PAID",
      expenseId: expense.id,
      message: `Payment of $${amount} to ${vendorName} processed. Expense record created.`
    }
  } catch (error) {
    console.error("Failed to create expense:", error)
    return {
      agent: "Payment Scheduler Agent",
      status: "ERROR",
      message: "Failed to create expense record."
    }
  }
}
