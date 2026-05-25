import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 20

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: session.organizationId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
    select: {
      id: true,
      invoiceNumber: true,
      issueDate: true,
      dueDate: true,
      clientName: true,
      clientEmail: true,
      subtotal: true,
      totalTax: true,
      total: true,
      status: true,
      createdAt: true,
    },
  })

  return NextResponse.json(invoices)
}

export async function POST(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { clientName, clientEmail, dueDate, lineItems, notes } = body

  if (!clientName || !dueDate || !Array.isArray(lineItems) || lineItems.length === 0) {
    return NextResponse.json({ error: "clientName, dueDate and lineItems are required" }, { status: 400 })
  }

  const subtotal = lineItems.reduce((s: number, l: any) => s + (l.quantity * l.unitPrice), 0)
  const totalTax = lineItems.reduce((s: number, l: any) => s + ((l.taxRate ?? 0) / 100 * l.quantity * l.unitPrice), 0)
  const total = subtotal + totalTax

  const count = await prisma.invoice.count({ where: { organizationId: session.organizationId } })
  const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: session.organizationId,
      invoiceNumber,
      issueDate: new Date(),
      dueDate: new Date(dueDate),
      clientName,
      clientEmail: clientEmail ?? "",
      subtotal,
      totalTax,
      total,
      status: "DRAFT",
      notes: notes ?? "",
      lineItems: {
        create: lineItems.map((l: any) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate ?? 0,
          total: l.quantity * l.unitPrice * (1 + (l.taxRate ?? 0) / 100),
        })),
      },
    },
  })

  return NextResponse.json(invoice, { status: 201 })
}
