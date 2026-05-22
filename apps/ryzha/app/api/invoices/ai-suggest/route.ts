import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { suggestInvoiceLineItems } from "@/lib/ai/invoice-generator"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { userInput, clientEmail } = await req.json()
    if (!userInput) return NextResponse.json({ error: "Input is required" }, { status: 400 })

    let clientHistory = ""
    if (clientEmail) {
      const pastInvoices = await prisma.invoice.findMany({
        where: { 
          organizationId: session.user.organizationId,
          clientEmail: clientEmail
        },
        include: { lineItems: true },
        take: 3,
        orderBy: { createdAt: "desc" }
      })

      if (pastInvoices.length > 0) {
        clientHistory = pastInvoices.map(inv => 
          inv.lineItems.map(li => li.description).join(", ")
        ).join("; ")
      }
    }

    const suggestions = await suggestInvoiceLineItems(userInput, clientHistory)
    return NextResponse.json(suggestions)
  } catch (error: any) {
    console.error("AI suggest error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
