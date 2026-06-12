import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const { provider } = await req.json() as { provider: string }

  if (!provider) {
    return NextResponse.json({ error: "Provider is required" }, { status: 400 })
  }

  const connection = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: provider as any } },
  })

  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 })
  }

  await prisma.integrationConnection.update({
    where: { id: connection.id },
    data: {
      status: "DISCONNECTED",
      accessToken: "",
      refreshToken: null,
      errorMessage: null,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}
