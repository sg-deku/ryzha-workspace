import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoicePDF } from "@/lib/pdf/invoice-pdf"
import QRCode from "qrcode"
import { NextResponse } from "next/server"
import React from 'react'

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return new Response("Unauthorized", { status: 401 })

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId: session.user.organizationId },
      include: { lineItems: true }
    })

    if (!invoice) return new Response("Invoice not found", { status: 404 })

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    })

    if (!organization) return new Response("Org not found", { status: 404 })

    // Generate QR Code for payment (Stripe mock link)
    const paymentUrl = `https://checkout.stripe.com/pay/${invoice.id}?amount=${invoice.total}`
    const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl)

    // Render PDF to Buffer
    const buffer = await renderToBuffer(
      React.createElement(InvoicePDF, { 
        invoice, 
        organization, 
        qrCodeDataUrl 
      }) as any
    )

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("PDF generation error:", error)
    return new Response(error.message || "Failed to generate PDF", { status: 500 })
  }
}
