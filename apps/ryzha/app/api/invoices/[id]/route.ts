import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await req.json()
    const { status, forceOverride } = payload

    if (status === "PAID" && !forceOverride) {
      return NextResponse.json(
        { error: "Setting status to PAID via PATCH is restricted. Use the Record Payment pipeline instead. Provide forceOverride: true to bypass." },
        { status: 400 }
      )
    }

    const existing = await prisma.invoice.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update invoice status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const {
      invoiceNumber,
      issueDate,
      dueDate,
      clientName,
      clientEmail,
      clientAddress,
      lineItems,
      subtotal,
      totalTax,
      total
    } = await req.json()

    const existing = await prisma.invoice.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json({ error: "Only draft invoices can be edited" }, { status: 400 })
    }

    const updated = await prisma.$transaction([
      prisma.invoiceLineItem.deleteMany({
        where: { invoiceId: id }
      }),
      prisma.invoice.update({
        where: { id },
        data: {
          invoiceNumber,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          clientName,
          clientEmail,
          clientAddress,
          subtotal,
          totalTax,
          total,
          lineItems: {
            create: lineItems.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              amount: item.amount
            }))
          }
        },
        include: {
          lineItems: true
        }
      })
    ])

    return NextResponse.json(updated[1])
  } catch (error) {
    console.error("Failed to update invoice:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
