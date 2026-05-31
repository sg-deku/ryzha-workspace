import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const run = await prisma.paymentRun.findUnique({
    where: { id, organizationId: session.user.organizationId },
    include: {
      items: {
        include: {
          vendorInvoice: {
            select: {
              id: true,
              invoiceNumber: true,
              amount: true,
              dueDate: true,
              status: true,
              vendorPayments: { select: { amount: true } },
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
              bankAccountName: true,
              bankIban: true,
              bankBic: true,
              bankRoutingNumber: true,
              bankAccountNumber: true,
              bankSortCode: true,
              bankCountry: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      bankAccount: true,
    },
  })

  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(run)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const run = await prisma.paymentRun.findUnique({ where: { id, organizationId: session.user.organizationId } })
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (run.status !== "DRAFT") return NextResponse.json({ error: "Only DRAFT runs can be edited" }, { status: 400 })

  const { name, paymentDate, currency, format, bankAccountId, notes } = await req.json()

  const updated = await prisma.paymentRun.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(paymentDate ? { paymentDate: new Date(paymentDate) } : {}),
      ...(currency ? { currency: currency.toUpperCase() } : {}),
      ...(format ? { format } : {}),
      ...(bankAccountId !== undefined ? { bankAccountId } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const run = await prisma.paymentRun.findUnique({ where: { id, organizationId: session.user.organizationId } })
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!["DRAFT", "CANCELLED"].includes(run.status)) {
    return NextResponse.json({ error: "Only DRAFT or CANCELLED runs can be deleted" }, { status: 400 })
  }

  await prisma.paymentRun.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
