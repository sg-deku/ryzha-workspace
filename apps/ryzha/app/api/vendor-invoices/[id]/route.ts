import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { after } from "next/server"
import { writeAudit, getClientIp } from "@/lib/audit"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { vendorId, invoiceNumber, purchaseOrderId, lineItems } = await req.json()

    const existing = await prisma.vendorInvoice.findUnique({
      where: { id, organizationId: session.user.organizationId },
    })
    if (!existing) return NextResponse.json({ error: "Vendor Invoice not found" }, { status: 404 })
    if (existing.status !== "RECEIVED") {
      return NextResponse.json({ error: "Only received vendor invoices can be edited" }, { status: 400 })
    }

    const amount = lineItems.reduce(
      (sum: number, item: any) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    )

    const updated = await prisma.$transaction([
      prisma.vendorInvoiceLine.deleteMany({ where: { vendorInvoiceId: id } }),
      prisma.vendorInvoice.update({
        where: { id },
        data: {
          vendorId, invoiceNumber, purchaseOrderId, amount,
          lineItems: { create: lineItems.map((item: any) => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice })) },
        },
        include: { lineItems: true, vendor: true },
      }),
    ])

    after(
      writeAudit({
        action: "UPDATE",
        entityType: "VendorInvoice",
        entityId: id,
        actorId: session.user.id,
        actorEmail: session.user.email,
        organizationId: session.user.organizationId,
        before: { invoiceNumber: existing.invoiceNumber, vendorId: existing.vendorId, amount: existing.amount },
        after: { invoiceNumber, vendorId, amount },
        details: { invoiceNumber },
        ipAddress: getClientIp(req),
      }).catch(console.error)
    )

    return NextResponse.json(updated[1])
  } catch (error) {
    console.error("Failed to update vendor invoice:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { status } = await req.json()

    const existing = await prisma.vendorInvoice.findUnique({
      where: { id, organizationId: session.user.organizationId },
    })
    if (!existing) return NextResponse.json({ error: "Vendor Invoice not found" }, { status: 404 })

    const updated = await prisma.vendorInvoice.update({ where: { id }, data: { status } })

    after(
      writeAudit({
        action: "STATUS_CHANGE",
        entityType: "VendorInvoice",
        entityId: id,
        actorId: session.user.id,
        actorEmail: session.user.email,
        organizationId: session.user.organizationId,
        before: { status: existing.status },
        after: { status },
        details: { invoiceNumber: existing.invoiceNumber, from: existing.status, to: status },
        ipAddress: getClientIp(req),
      }).catch(console.error)
    )

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update vendor invoice status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
