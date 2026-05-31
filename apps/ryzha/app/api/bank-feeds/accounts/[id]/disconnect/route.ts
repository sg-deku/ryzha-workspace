import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const account = await prisma.bankAccount.findFirst({
    where: { id: params.id, organizationId: session.user.organizationId },
    select: { id: true },
  })

  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 })

  await prisma.bankAccount.update({
    where: { id: params.id },
    data: {
      connectionType: "MANUAL",
      syncStatus: "IDLE",
      plaidItemId: null,
      plaidAccountId: null,
      plaidAccessToken: null,
      plaidCursor: null,
      trueLayerConnectionId: null,
      trueLayerAccountId: null,
      trueLayerAccessToken: null,
      trueLayerRefreshToken: null,
      trueLayerTokenExpiry: null,
      institutionName: null,
      institutionLogo: null,
      lastSyncError: null,
    },
  })

  return NextResponse.json({ ok: true })
}
