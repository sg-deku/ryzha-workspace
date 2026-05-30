import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateInvoiceNumber } from "@/lib/invoice-number"
import { NextResponse } from "next/server"
import { after } from "next/server"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"
import { mapInvoiceToAccount } from "@/lib/reports/general-ledger/account-mapping"

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [nextNumber, org] = await Promise.all([
    generateInvoiceNumber(session.user.organizationId),
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { defaultTaxRate: true }
    })
  ])
  
  return NextResponse.json({ 
    nextNumber, 
    defaultTaxRate: org?.defaultTaxRate || 0 
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
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
    } = body

    const invoice = await prisma.invoice.create({
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
        status: "DRAFT",
        organizationId: session.user.organizationId,
        lineItems: {
          create: lineItems.map((li: any) => ({
            productId: li.productId ?? null,
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            discount: li.discount ?? 0,
            taxRate: li.taxRate,
            amount: li.amount,
            accountCode: li.accountCode ?? null,
            notes: li.notes ?? null,
          }))
        }
      },
      include: { lineItems: true }
    })

    const orgId = session.user.organizationId
    const jeLines: Array<{ accountName: string; accountType?: string; debit: number; credit: number; description?: string }> = []

    jeLines.push({
      accountName: "Accounts Receivable",
      accountType: "Assets",
      debit: total,
      credit: 0,
      description: `${invoiceNumber} – Amount due (${clientName})`,
    })

    for (const li of invoice.lineItems) {
      const accountName = mapInvoiceToAccount(li.description)
      jeLines.push({
        accountName,
        accountType: "Revenue",
        debit: 0,
        credit: li.amount,
        description: `${invoiceNumber} – ${li.description}`,
      })
    }

    if (totalTax > 0) {
      jeLines.push({
        accountName: "Tax Payable",
        accountType: "Liabilities",
        debit: 0,
        credit: totalTax,
        description: `${invoiceNumber} – Sales Tax`,
      })
    }

    after(
      createSystemJournalEntry({
        organizationId: orgId,
        sourceType: "Invoice",
        sourceId: invoice.id,
        reference: invoiceNumber,
        description: `Invoice issued – ${clientName}`,
        entryDate: new Date(issueDate),
        lines: jeLines,
      }).catch(console.error)
    )

    return NextResponse.json(invoice)
  } catch (error: any) {
    console.error("Invoice creation error:", error)
    return NextResponse.json({ error: error.message || "Failed to create invoice" }, { status: 500 })
  }
}
