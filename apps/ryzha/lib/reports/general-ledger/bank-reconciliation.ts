import { prisma } from "@/lib/prisma"

export async function checkStripeReconciliation(organizationId: string) {
  const stripeClearingBalance = await prisma.generalLedgerEntry.aggregate({
    where: { organizationId, accountName: "Stripe Clearing Account" },
    _sum: { debit: true, credit: true }
  })
  
  const balance = (stripeClearingBalance._sum.debit ?? 0) - (stripeClearingBalance._sum.credit ?? 0)

  let status = "reconciled"
  let message = "Stripe Clearing Account is balanced."
  
  if (Math.abs(balance) > 0.01) {
    status = "unreconciled"
    message = `Stripe Clearing Account has unreconciled balance: $${balance.toFixed(2)}`
  }

  return { balance, status, message }
}
