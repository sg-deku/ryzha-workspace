import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const accounts = await prisma.bankAccount.findMany({
    where: { organizationId: session.user.organizationId },
    select: {
      id: true,
      name: true,
      connectionType: true,
      syncStatus: true,
      lastSyncedAt: true,
      lastSyncError: true,
      institutionName: true,
      institutionLogo: true,
      plaidItemId: true,
      trueLayerConnectionId: true,
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(accounts)
}
