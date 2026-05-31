import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseBudgetCsv } from "@/lib/budgets/budget-engine"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const budgetId = formData.get("budgetId") as string | null

    if (!file || !budgetId) {
      return NextResponse.json({ error: "file and budgetId are required" }, { status: 400 })
    }

    const budget = await prisma.budget.findUnique({
      where: { id: budgetId, organizationId: session.user.organizationId },
    })
    if (!budget) return NextResponse.json({ error: "Budget not found" }, { status: 404 })

    const csv = await file.text()
    const rows = parseBudgetCsv(csv, budgetId)

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 })
    }

    await prisma.budgetLine.deleteMany({ where: { budgetId } })
    await prisma.budgetLine.createMany({
      data: rows.map((r) => ({ ...r, id: crypto.randomUUID() })),
      skipDuplicates: true,
    })

    return NextResponse.json({ imported: rows.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
