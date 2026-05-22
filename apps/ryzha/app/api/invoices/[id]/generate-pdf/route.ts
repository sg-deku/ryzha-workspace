import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoicePDF } from "@/lib/pdf/invoice-pdf"
import { uploadToS3 } from "@/lib/s3-uploader"
import QRCode from "qrcode"
import { NextResponse } from "next/server"
import React from 'react'

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, organizationId: session.user.organizationId },
      include: { lineItems: true }
    })

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    })

    if (!organization) return NextResponse.json({ error: "Org not found" }, { status: 404 })

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

    // Upload to S3
    const fileName = `invoices/${organization.id}/${invoice.invoiceNumber}-${Date.now()}.pdf`
    const pdfUrl = await uploadToS3(buffer, fileName, "application/pdf")

    // Update Invoice in DB
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl, status: "SENT" }
    })

    return NextResponse.json(updatedInvoice)
  } catch (error: any) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 })
  }
}
