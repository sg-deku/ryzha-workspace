import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { after } from "next/server"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"
import { mapVendorInvoiceToAccount } from "@/lib/reports/general-ledger/account-mapping"
import { startP2PWorkflow } from "@/lib/agents/orchestrator"
import { getNextEntityNumber } from "@/lib/sequences"

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const vendorId = searchParams.get("vendorId")
  const status = searchParams.get("status")

  const invoices = await prisma.vendorInvoice.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(vendorId ? { vendorId } : {}),
      ...(status ? { status } : {}),
    },
    select: { id: true, invoiceNumber: true, amount: true, status: true, dueDate: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json(invoices)
}

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

    const [vendor, internalNumber] = await Promise.all([
      prisma.vendor.findUnique({ where: { id: vendorId }, select: { name: true } }),
      getNextEntityNumber(session.user.organizationId, "VINV"),
    ])

    const vendorInvoice = await prisma.vendorInvoice.create({
      data: {
        internalNumber,
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
      Promise.all([
        createSystemJournalEntry({
          organizationId: orgId,
          sourceType: "VendorInvoice",
          sourceId: vendorInvoice.id,
          reference: invoiceNumber,
          description: `Vendor invoice – ${vendorName}`,
          entryDate: new Date(),
          lines: jeLines,
        }),
        startP2PWorkflow(vendorInvoice.id),
      ]).catch(console.error)
    )

    return NextResponse.json(vendorInvoice)
  } catch (error) {
    console.error("Error creating vendor invoice:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
