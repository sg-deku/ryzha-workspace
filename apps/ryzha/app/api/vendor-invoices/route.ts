import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { after } from "next/server"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"
import { mapVendorInvoiceToAccount } from "@/lib/reports/general-ledger/account-mapping"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { vendorId, purchaseOrderId, invoiceNumber, lineItems } = await req.json()

    if (!vendorId || !invoiceNumber || !lineItems || lineItems.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const totalAmount = lineItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { name: true } })

    const vendorInvoice = await prisma.vendorInvoice.create({
      data: {
        invoiceNumber,
        vendorId,
        purchaseOrderId: purchaseOrderId || null,
        status: "RECEIVED",
        amount: totalAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        organizationId: session.user.organizationId,
        lineItems: {
          create: lineItems.map((item: any) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            amount: Number(item.quantity) * Number(item.unitPrice),
          }))
        }
      },
      include: { lineItems: true },
    })

    const orgId = session.user.organizationId
    const vendorName = vendor?.name ?? "Vendor"

    const jeLines: Array<{ accountName: string; accountType: string; debit: number; credit: number; description?: string }> = []

    for (const item of vendorInvoice.lineItems) {
      const accountName = mapVendorInvoiceToAccount(vendorName, item.description)
      jeLines.push({
        accountName,
        accountType: "Expenses",
        debit: item.amount,
        credit: 0,
        description: `${invoiceNumber} – ${item.description} (${vendorName})`,
      })
    }

    jeLines.push({
      accountName: "Accounts Payable",
      accountType: "Liabilities",
      debit: 0,
      credit: totalAmount,
      description: `${invoiceNumber} – Amount owed to ${vendorName}`,
    })

    after(
      createSystemJournalEntry({
        organizationId: orgId,
        sourceType: "VendorInvoice",
        sourceId: vendorInvoice.id,
        reference: invoiceNumber,
        description: `Vendor invoice – ${vendorName}`,
        entryDate: new Date(),
        lines: jeLines,
      }).catch(console.error)
    )

    return NextResponse.json(vendorInvoice)
  } catch (error) {
    console.error("Error creating vendor invoice:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
