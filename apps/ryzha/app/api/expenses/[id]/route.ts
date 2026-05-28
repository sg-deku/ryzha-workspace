import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { description, amount, date, category, status } = body

  const expense = await prisma.expense.findUnique({
    where: { id, organizationId: session.user.organizationId },
  })
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const validStatuses = ["PENDING", "CATEGORIZED", "REVIEWED", "APPROVED", "PAID"]
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...(description !== undefined ? { description } : {}),
      ...(amount !== undefined ? { amount: parseFloat(amount) } : {}),
      ...(date !== undefined ? { date: new Date(date) } : {}),
      ...(category !== undefined ? { category: category || null } : {}),
      ...(status !== undefined ? { status } : {}),
    },
    include: { anomalies: true },
  })

  return NextResponse.json(updated)
}
