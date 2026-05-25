import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 20

  const expenses = await prisma.expense.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { date: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  })

  return NextResponse.json(expenses)
}

export async function POST(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { date, description, amount, category } = await req.json()

    if (!date || !description || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        description,
        amount: Number(amount),
        category: category || null,
        status: "PENDING",
        organizationId: session.organizationId,
      },
    })

    return NextResponse.json(expense)
  } catch (err) {
    console.error("[mobile/expenses POST]", err)
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}
