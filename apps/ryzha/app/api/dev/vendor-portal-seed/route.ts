import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createPortalSession, buildPortalUrl } from "@/lib/vendor-portal/auth"

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const vendorId = searchParams.get("vendorId")

  let vendor
  if (vendorId) {
    vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
  } else {
    vendor = await prisma.vendor.findFirst({ orderBy: { createdAt: "asc" } })
  }

  if (!vendor) {
    return NextResponse.json({ error: "No vendors found. Create a vendor first." }, { status: 404 })
  }

  const email = vendor.portalEmail || vendor.email || "dev@test.local"

  const session = await createPortalSession(vendor.id, email)

  const baseUrl = "http://localhost:3000"
  const portalUrl = buildPortalUrl(session.token, baseUrl)

  return NextResponse.json({
    vendor: { id: vendor.id, name: vendor.name, email },
    token: session.token,
    expiresAt: session.expiresAt,
    portalUrl,
    instructions: `Open the portalUrl in your browser to log into the vendor portal as "${vendor.name}".`,
  })
}
