import { NextRequest, NextResponse } from "next/server"
import { getPortalSession } from "@/lib/vendor-portal/middleware"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const portalSession = await getPortalSession(req)
  if (!portalSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const invoices = await prisma.vendorInvoice.findMany({
    where: { vendorId: portalSession.vendorId },
    include: {
      vendorPayments: {
        select: { id: true, amount: true, paymentDate: true, method: true, referenceNumber: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(invoices)
}
