import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { approveRequest } from "@/lib/approvals/approval-engine"
import { NextRequest, NextResponse } from "next/server"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"
import { mapExpenseCategoryToAccount } from "@/lib/reports/general-ledger/account-mapping"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { note } = await req.json().catch(() => ({ note: undefined }))

    const approvalReq = await prisma.approvalRequest.findUnique({ where: { id } })
    if (!approvalReq || approvalReq.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updated = await approveRequest(
      session.user.organizationId,
      id,
      session.user.id,
      session.user.name ?? session.user.email ?? session.user.id,
      note
    )

    if (approvalReq.entityType === "Expense") {
      const expense = await prisma.expense.findFirst({
        where: { approvalRequestId: id, organizationId: session.user.organizationId },
      })
      if (expense) {
        const accountName = mapExpenseCategoryToAccount(expense.category)
        await createSystemJournalEntry({
          organizationId: session.user.organizationId,
          sourceType: "Expense",
          sourceId: expense.id,
          reference: `EXP-${expense.id.slice(-6)}`,
          description: `Expense – ${expense.description}`,
          entryDate: expense.date,
          lines: [
            { accountName, accountType: "Expenses", debit: expense.amount, credit: 0, description: expense.description },
            { accountName: "Cash", accountType: "Assets", debit: 0, credit: expense.amount, description: `Cash paid – ${expense.description}` },
          ],
        }).catch(console.error)
      }
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
