import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { vendorId } = await req.json()
  if (!vendorId) return NextResponse.json({ error: "vendorId required" }, { status: 400 })

  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, organizationId: session.user.organizationId },
  })
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 })

  await prisma.vendorPortalSession.deleteMany({ where: { vendorId } })

  await prisma.vendor.update({
    where: { id: vendorId },
    data: { portalEnabled: false },
  })

  return NextResponse.json({ success: true })
}
