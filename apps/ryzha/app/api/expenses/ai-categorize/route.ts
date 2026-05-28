import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { categorizeExpense } from "@/lib/ai/expense-categorizer"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { expenseId } = await req.json()
    if (!expenseId) {
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 })
    }

    const expense = await prisma.expense.findFirst({
      where: { 
        id: expenseId, 
        organizationId: session.user.organizationId 
      }
    })

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    const [aiResult, existingAnomalies, settings] = await Promise.all([
      categorizeExpense(expense.description, expense.amount, session.user.organizationId),
      prisma.expenseAnomaly.findMany({ where: { expenseId }, take: 1 }),
      prisma.financialSettings.findUnique({ where: { organizationId: session.user.organizationId } }),
    ])

    const anomalyThreshold = settings?.anomalyThreshold ?? 10000
    const isHighValue = expense.amount >= anomalyThreshold
    const hasAnomalies = existingAnomalies.length > 0 || isHighValue

    // Never auto-approve high-value or already-flagged expenses — keep at REVIEWED for human sign-off
    const status = (aiResult.confidence > 0.7 && !hasAnomalies) ? "CATEGORIZED" : "REVIEWED"

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        category: aiResult.category,
        taxRelevant: aiResult.taxRelevant,
        status,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("AI categorization route error:", error)
    return NextResponse.json({ error: error.message || "Failed to categorize expense" }, { status: 500 })
  }
}
