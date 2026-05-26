import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CashApplicationClient } from "./cash-application-client"

export const dynamic = "force-dynamic";

export default async function CashApplicationPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) redirect("/login")
  
  const organizationId = session.user.organizationId

  // Unmatched BankTransactions
  const unmatched = await prisma.bankTransaction.findMany({
    where: { organizationId, matchStatus: "unmatched" },
    orderBy: { date: "desc" }
  })

  // Open invoices for matching candidates
  const openInvoices = await prisma.invoice.findMany({
    where: { organizationId, status: { in: ["SENT", "PARTIAL"] } }
  })

  return <CashApplicationClient unmatched={unmatched} openInvoices={openInvoices} />
}
