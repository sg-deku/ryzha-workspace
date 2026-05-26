import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripeForOrg } from "@/lib/stripe"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = params
  const orgId = session.user.organizationId

  const invoice = await prisma.invoice.findUnique({
    where: { id, organizationId: orgId },
    include: { lineItems: true },
  })

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  }

  const stripe = await getStripeForOrg(orgId)
  
  if (!stripe) {
     return NextResponse.json({ error: "Stripe not configured for this organization" }, { status: 400 })
  }

  try {
    const paymentLink = await stripe.paymentLinks.create({
      line_items: invoice.lineItems.map(item => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.description },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      })),
      metadata: {
        organizationId: orgId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customer_email: invoice.clientEmail,
      },
      after_completion: {
        type: "redirect",
        redirect: { url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/thank-you?invoice=${invoice.id}` }
      }
    })

    return NextResponse.json({ url: paymentLink.url })
  } catch (error: any) {
    console.error("Failed to create Stripe payment link:", error)
    return NextResponse.json({ error: error.message || "Failed to create payment link" }, { status: 500 })
  }
}
