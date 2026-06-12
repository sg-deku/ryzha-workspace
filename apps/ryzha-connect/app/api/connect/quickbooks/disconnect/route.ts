import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { revokeQBToken } from "@ryzha/integrations"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const connection = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
  })

  if (!connection) {
    return NextResponse.redirect(new URL("/connect", req.url))
  }

  try {
    await revokeQBToken(connection.accessToken)
  } catch {
    // Best-effort revoke - proceed with local disconnect regardless
  }

  await prisma.integrationConnection.update({
    where: { id: connection.id },
    data: { status: "DISCONNECTED", accessToken: "", refreshToken: null, scope: null, errorMessage: null, updatedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
