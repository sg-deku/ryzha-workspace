import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { detectAnomalies } from "@/lib/ai/anomaly-detector"
import { syncGLForOrganization } from "@/lib/reports/general-ledger/sync"
import { after } from "next/server"

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

    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        description,
        amount: expenseAmount,
        category: category || null,
        status: "PENDING",
        organizationId,
      },
    })

    await detectAnomalies(expense.id, organizationId)
    after(syncGLForOrganization(organizationId).catch(console.error))

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
