import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const { clientId, clientSecret } = await req.json()

  if (!clientId?.trim() || !clientSecret?.trim()) {
    return NextResponse.json({ error: "Client ID and Client Secret are required" }, { status: 400 })
  }

  const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3001").replace(/\/+$/, "")
  const redirectUri = `${base}/api/connect/quickbooks/callback`

  await prisma.integrationConnection.upsert({
    where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
    create: {
      organizationId,
      provider: "QUICKBOOKS",
      displayName: "QuickBooks Online",
      accessToken: "",
      scope: JSON.stringify({ clientId, clientSecret, redirectUri }),
      status: "DISCONNECTED",
    },
    update: {
      scope: JSON.stringify({ clientId, clientSecret, redirectUri }),
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true, redirectUri })
}
