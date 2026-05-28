import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const memo = await prisma.vendorDebitMemo.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      vendor: true,
      vendorInvoice: { select: { id: true, invoiceNumber: true, amount: true } },
    },
  })

  if (!memo) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(memo)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { status } = body

  const allowed = ["OPEN", "APPLIED", "PAID", "VOID"]
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${allowed.join(", ")}` }, { status: 400 })
  }

  const memo = await prisma.vendorDebitMemo.findFirst({
    where: { id, organizationId: session.user.organizationId },
  })
  if (!memo) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.vendorDebitMemo.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const memo = await prisma.vendorDebitMemo.findFirst({
    where: { id, organizationId: session.user.organizationId },
  })
  if (!memo) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (memo.status !== "OPEN") {
    return NextResponse.json({ error: "Only OPEN memos can be deleted. Use VOID instead." }, { status: 400 })
  }

  await prisma.vendorDebitMemo.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
