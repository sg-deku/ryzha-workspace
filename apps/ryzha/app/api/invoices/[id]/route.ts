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

    if (status === "VOID" && existing.status !== "VOID") {
      await prisma.generalLedgerEntry.createMany({
        skipDuplicates: true,
        data: [
          {
            organizationId: session.user.organizationId,
            date: new Date(),
            accountType: "Revenue",
            accountName: "Service Revenue",
            debit: existing.subtotal,
            credit: 0,
            amount: existing.subtotal,
            description: `Reversal for voided invoice ${existing.invoiceNumber}`,
            sourceType: "invoice_void",
            sourceId: existing.id
          },
          {
            organizationId: session.user.organizationId,
            date: new Date(),
            accountType: "Assets",
            accountName: "Accounts Receivable",
            debit: 0,
            credit: existing.total,
            amount: -existing.total,
            description: `Reversal for voided invoice ${existing.invoiceNumber}`,
            sourceType: "invoice_void",
            sourceId: existing.id
          }
        ]
      })
      if (existing.totalTax > 0) {
        await prisma.generalLedgerEntry.create({
          data: {
            organizationId: session.user.organizationId,
            date: new Date(),
            accountType: "Liabilities",
            accountName: "Sales Tax Payable",
            debit: existing.totalTax,
            credit: 0,
            amount: existing.totalTax,
            description: `Reversal for voided invoice ${existing.invoiceNumber}`,
            sourceType: "invoice_void",
            sourceId: existing.id
          }
        })
      }
    }

    if (status === "PAID" && existing.status !== "PAID") {
      const payments = await prisma.payment.count({ where: { invoiceId: id } })
      if (payments === 0) {
        const { createNotification } = await import("@/lib/notifications")
        await createNotification({
          organizationId: session.user.organizationId,
          type: "WARNING",
          title: "Invoice Paid Without Payment Record",
          message: `Invoice #${existing.invoiceNumber} was manually marked as PAID, but no payment record exists.`,
          link: `/invoices/${existing.id}`
        }).catch(() => {})
      }
    }

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
