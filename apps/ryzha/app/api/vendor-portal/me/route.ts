import { NextRequest, NextResponse } from "next/server"
import { getPortalSession } from "@/lib/vendor-portal/middleware"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const portalSession = await getPortalSession(req)
  if (!portalSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const vendor = await prisma.vendor.findUnique({
    where: { id: portalSession.vendorId },
    select: {
      id: true,
      name: true,
      email: true,
      taxId: true,
      address: true,
      paymentTerms: true,
      status: true,
      bankAccountName: true,
      bankIban: true,
      bankBic: true,
      bankRoutingNumber: true,
      bankAccountNumber: true,
      bankSortCode: true,
      bankCountry: true,
      organization: { select: { name: true, currency: true } },
    },
  })

  if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(vendor)
}
