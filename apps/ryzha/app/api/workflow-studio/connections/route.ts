import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const connections = await prisma.wsConnection.findMany({
    where: { organizationId: session.user.organizationId },
    include: { connector: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ connections })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { connectorId, name, config } = body

  if (!connectorId || !name) return NextResponse.json({ error: "connectorId and name are required" }, { status: 400 })

  const encryptedConfig = JSON.stringify(config ?? {})

  const connection = await prisma.wsConnection.create({
    data: {
      organizationId: session.user.organizationId,
      connectorId,
      name,
      encryptedConfig,
      status: "ACTIVE",
    },
    include: { connector: true },
  })

  return NextResponse.json({ connection }, { status: 201 })
}
