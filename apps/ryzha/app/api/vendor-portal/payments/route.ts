import { NextRequest, NextResponse } from "next/server"
import { getPortalSession } from "@/lib/vendor-portal/middleware"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const portalSession = await getPortalSession(req)
  if (!portalSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payments = await prisma.vendorPayment.findMany({
    where: { vendorId: portalSession.vendorId },
    include: {
      vendorInvoice: { select: { id: true, invoiceNumber: true, amount: true } },
    },
    orderBy: { paymentDate: "desc" },
  })

  return NextResponse.json(payments)
}
