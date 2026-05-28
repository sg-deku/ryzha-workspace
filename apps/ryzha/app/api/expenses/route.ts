import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { after } from "next/server"
import { detectAnomalies } from "@/lib/ai/anomaly-detector"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"
import { mapExpenseCategoryToAccount } from "@/lib/reports/general-ledger/account-mapping"
import { getNextEntityNumber } from "@/lib/sequences"

export const dynamic = "force-dynamic";

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

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        date: new Date(date),
        description,
        amount: expenseAmount,
        category: category || null,
        status: "PENDING",
        organizationId,
      },
    })

    const accountName = mapExpenseCategoryToAccount(category)

    after(
      Promise.all([
        detectAnomalies(expense.id, organizationId),
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
      ]).catch(console.error)
    )

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
