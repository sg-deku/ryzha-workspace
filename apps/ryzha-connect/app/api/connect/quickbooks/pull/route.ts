import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { pullQBARAging, pullQBAPAging, pullQBBankBalances } from "@ryzha/integrations"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const conn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
    select: { id: true, accessToken: true, realmId: true, status: true },
  })

  if (!conn || conn.status !== "ACTIVE" || !conn.realmId) {
    return NextResponse.json({ error: "QuickBooks not connected" }, { status: 400 })
  }

  const { type } = await req.json().catch(() => ({ type: "all" }))

  const results: Record<string, unknown> = {}

  try {
    if (type === "all" || type === "ar") {
      const ar = await pullQBARAging(conn.accessToken, conn.realmId)
      results.ar = ar

      await prisma.integrationSyncLog.create({
        data: {
          integrationConnectionId: conn.id,
          direction: "PULL",
          entityType: "AR_AGING",
          status: "SUCCESS",
          responsePayload: ar as any,
        },
      })
    }

    if (type === "all" || type === "ap") {
      const ap = await pullQBAPAging(conn.accessToken, conn.realmId)
      results.ap = ap

      await prisma.integrationSyncLog.create({
        data: {
          integrationConnectionId: conn.id,
          direction: "PULL",
          entityType: "AP_AGING",
          status: "SUCCESS",
          responsePayload: ap as any,
        },
      })
    }

    if (type === "all" || type === "balances") {
      const balances = await pullQBBankBalances(conn.accessToken, conn.realmId)
      results.balances = balances

      await prisma.integrationSyncLog.create({
        data: {
          integrationConnectionId: conn.id,
          direction: "PULL",
          entityType: "BANK_BALANCES",
          status: "SUCCESS",
          responsePayload: balances as any,
        },
      })
    }

    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: new Date() },
    })

    return NextResponse.json({ ok: true, ...results })
  } catch (err: any) {
    await prisma.integrationSyncLog.create({
      data: {
        integrationConnectionId: conn.id,
        direction: "PULL",
        entityType: type ?? "UNKNOWN",
        status: "FAILED",
        errorMessage: err.message,
      },
    })

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
