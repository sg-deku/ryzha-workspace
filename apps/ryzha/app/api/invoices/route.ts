import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateInvoiceNumber } from "@/lib/invoice-number"
import { NextResponse } from "next/server"

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
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            taxRate: li.taxRate,
            amount: li.amount
          }))
        }
      },
      include: { lineItems: true }
    })

    return NextResponse.json(invoice)
  } catch (error: any) {
    console.error("Invoice creation error:", error)
    return NextResponse.json({ error: error.message || "Failed to create invoice" }, { status: 500 })
  }
}
