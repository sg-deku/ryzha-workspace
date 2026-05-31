import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const run = await prisma.paymentRun.findUnique({ where: { id, organizationId: session.user.organizationId } })
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (run.status !== "DRAFT") return NextResponse.json({ error: "Can only remove items from DRAFT runs" }, { status: 400 })

  await prisma.paymentRunItem.delete({ where: { id: itemId, paymentRunId: id } })

  const totalAmount = await prisma.paymentRunItem.aggregate({
    where: { paymentRunId: id },
    _sum: { amount: true },
  })

  await prisma.paymentRun.update({
    where: { id },
    data: { totalAmount: totalAmount._sum.amount ?? 0 },
  })

  return NextResponse.json({ deleted: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const run = await prisma.paymentRun.findUnique({ where: { id, organizationId: session.user.organizationId } })
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (run.status !== "DRAFT") return NextResponse.json({ error: "Can only edit items in DRAFT runs" }, { status: 400 })

  const { amount } = await req.json()
  if (!amount || amount <= 0) return NextResponse.json({ error: "amount must be > 0" }, { status: 400 })

  const updated = await prisma.paymentRunItem.update({
    where: { id: itemId, paymentRunId: id },
    data: { amount },
  })

  const totalAmount = await prisma.paymentRunItem.aggregate({
    where: { paymentRunId: id },
    _sum: { amount: true },
  })

  await prisma.paymentRun.update({
    where: { id },
    data: { totalAmount: totalAmount._sum.amount ?? 0 },
  })

  return NextResponse.json(updated)
}
