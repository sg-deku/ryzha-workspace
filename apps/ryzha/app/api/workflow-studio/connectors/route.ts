import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { seedConnectorCatalog } from "@/lib/workflow-studio/seed-connectors"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let connectors = await prisma.wsConnector.findMany({
    where: { isActive: true },
    include: {
      triggers: { orderBy: { sortOrder: "asc" } },
      actions: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  })

  if (connectors.length === 0) {
    await seedConnectorCatalog()
    connectors = await prisma.wsConnector.findMany({
      where: { isActive: true },
      include: {
        triggers: { orderBy: { sortOrder: "asc" } },
        actions: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    })
  }

  return NextResponse.json({ connectors })
}
