import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { createPortalSession, buildPortalUrl, PORTAL_SESSION_TTL_HOURS } from "@/lib/vendor-portal/auth"
import { sendPortalInviteEmail } from "@/lib/vendor-portal/emails"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { vendorId, email } = await req.json()
  if (!vendorId || !email) return NextResponse.json({ error: "vendorId and email required" }, { status: 400 })

  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, organizationId: session.user.organizationId },
    include: { organization: { select: { name: true } } },
  })
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 })

  const portalSession = await createPortalSession(vendorId, email)

  const baseUrl = process.env.NEXTAUTH_URL || "https://app.ryzha.com"
  const portalUrl = buildPortalUrl(portalSession.token, baseUrl)

  await sendPortalInviteEmail({
    to: email,
    vendorName: vendor.name,
    orgName: vendor.organization.name,
    portalUrl,
    expiryHours: PORTAL_SESSION_TTL_HOURS,
  })

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      portalEnabled: true,
      portalEmail: email,
      portalInvitedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true, expiresAt: portalSession.expiresAt })
}
