import { NextRequest, NextResponse } from "next/server"
import { getPortalSession } from "@/lib/vendor-portal/middleware"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest) {
  const portalSession = await getPortalSession(req)
  if (!portalSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const allowed = [
    "email",
    "address",
    "bankAccountName",
    "bankIban",
    "bankBic",
    "bankRoutingNumber",
    "bankAccountNumber",
    "bankSortCode",
    "bankCountry",
  ]

  const changes: Record<string, any> = {}
  for (const key of allowed) {
    if (key in body) changes[key] = body[key]
  }

  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 })
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: portalSession.vendorId },
    select: { organizationId: true },
  })
  if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const change = await prisma.vendorProfileChange.create({
    data: {
      vendorId: portalSession.vendorId,
      organizationId: vendor.organizationId,
      changes,
    },
  })

  return NextResponse.json({ success: true, changeRequestId: change.id })
}
