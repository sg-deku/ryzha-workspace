import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { after } from "next/server"
import { detectAnomalies } from "@/lib/ai/anomaly-detector"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"
import { mapExpenseCategoryToAccount } from "@/lib/reports/general-ledger/account-mapping"
import { getNextEntityNumber } from "@/lib/sequences"
import { createApprovalRequest } from "@/lib/approvals/approval-engine"
import { runExpenseApprovalAgent } from "@/lib/agents/p2p/approval"

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const expenses = await prisma.expense.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return NextResponse.json(expenses)
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date, description, amount, category } = await req.json()

    if (!date || !description || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const organizationId = session.user.organizationId
    const expenseAmount = Number(amount)
    const expenseNumber = await getNextEntityNumber(organizationId, "EXPENSE")

    const settings = await prisma.p2PSettings.findUnique({ where: { organizationId } })
    const autoApproveLimit = settings?.autoApproveLimit ?? 500

    const needsApproval = expenseAmount > autoApproveLimit

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        date: new Date(date),
        description,
        amount: expenseAmount,
        category: category || null,
        status: needsApproval ? "PENDING" : "APPROVED",
        ...(needsApproval
          ? {}
          : {
              approvedBy: session.user.name ?? session.user.email ?? "Auto-approved",
              approvedAt: new Date(),
            }),
        organizationId,
      },
    })

    if (needsApproval) {
      const aiRouting = await runExpenseApprovalAgent(expense.id, organizationId)
      const approverId = settings?.escalationApproverId ?? session.user.id
      const approvalReq = await createApprovalRequest({
        organizationId,
        entityType: "Expense",
        entityId: expense.id,
        approverId,
        approverName: aiRouting.primaryApprover,
        requestedBy: session.user.name ?? session.user.email ?? session.user.id,
        amount: expenseAmount,
        description: `Expense — ${description} | AI routing: ${aiRouting.reasoning}`,
      })

      await prisma.expense.update({
        where: { id: expense.id },
        data: { approvalRequestId: approvalReq.id },
      })
    }

    const accountName = mapExpenseCategoryToAccount(category)

    after(
      Promise.all([
        detectAnomalies(expense.id, organizationId),
        ...(needsApproval
          ? []
          : [
              createSystemJournalEntry({
                organizationId,
                sourceType: "Expense",
                sourceId: expense.id,
                reference: `EXP-${expense.id.slice(-6)}`,
                description: `Expense – ${description}`,
                entryDate: new Date(date),
                lines: [
                  {
                    accountName,
                    accountType: "Expenses",
                    debit: expenseAmount,
                    credit: 0,
                    description,
                  },
                  {
                    accountName: "Cash",
                    accountType: "Assets",
                    debit: 0,
                    credit: expenseAmount,
                    description: `Cash paid – ${description}`,
                  },
                ],
              }),
            ]),
      ]).catch(console.error)
    )

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
