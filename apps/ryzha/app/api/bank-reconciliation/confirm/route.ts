import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId
  const body = await req.json()
  const { bankTransactionId, matchType, matchedId } = body

  if (!bankTransactionId || !matchType || !matchedId) {
    return NextResponse.json({ error: "bankTransactionId, matchType, and matchedId are required" }, { status: 400 })
  }

  const btx = await prisma.bankTransaction.findUnique({
    where: { id: bankTransactionId, organizationId: orgId },
  })
  if (!btx) return NextResponse.json({ error: "Bank transaction not found" }, { status: 404 })

  if (matchType === "vendor_payment") {
    const vp = await prisma.vendorPayment.findUnique({
      where: { id: matchedId, organizationId: orgId },
    })
    if (!vp) return NextResponse.json({ error: "Vendor payment not found" }, { status: 404 })

    await prisma.bankTransaction.update({
      where: { id: bankTransactionId },
      data: {
        matchStatus: "matched",
        matchedVendorPaymentId: matchedId,
        reconciledAt: new Date(),
      },
    })
  } else if (matchType === "invoice_payment") {
    const pay = await prisma.payment.findUnique({
      where: { id: matchedId, organizationId: orgId },
    })
    if (!pay) return NextResponse.json({ error: "Payment not found" }, { status: 404 })

    await prisma.bankTransaction.update({
      where: { id: bankTransactionId },
      data: {
        matchStatus: "matched",
        matchedPaymentId: matchedId,
        reconciledAt: new Date(),
      },
    })
  } else {
    return NextResponse.json({ error: "Invalid matchType. Must be vendor_payment or invoice_payment" }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
