import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { pullQBARAging, pullQBAPAging, pullQBBankBalances, syncQBChartOfAccounts } from "@ryzha/integrations"

export const dynamic = "force-dynamic"

async function runSync(organizationId: string) {
  const conn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
    select: { id: true, accessToken: true, realmId: true, status: true },
  })

  if (!conn || conn.status !== "ACTIVE" || !conn.realmId) {
    throw new Error("QuickBooks not connected or not active")
  }

  const results: Record<string, unknown> = {}
  const errors: string[] = []

  await Promise.allSettled([
    pullQBARAging(conn.accessToken, conn.realmId).then(async (ar) => {
      results.ar = ar
      await prisma.integrationSyncLog.create({
        data: { integrationConnectionId: conn.id, direction: "PULL", entityType: "AR_AGING", status: "SUCCESS", responsePayload: ar as any },
      })
    }).catch((e) => errors.push(`AR: ${e.message}`)),

    pullQBAPAging(conn.accessToken, conn.realmId).then(async (ap) => {
      results.ap = ap
      await prisma.integrationSyncLog.create({
        data: { integrationConnectionId: conn.id, direction: "PULL", entityType: "AP_AGING", status: "SUCCESS", responsePayload: ap as any },
      })
    }).catch((e) => errors.push(`AP: ${e.message}`)),

    pullQBBankBalances(conn.accessToken, conn.realmId).then(async (balances) => {
      results.balances = balances
      await prisma.integrationSyncLog.create({
        data: { integrationConnectionId: conn.id, direction: "PULL", entityType: "BANK_BALANCES", status: "SUCCESS", responsePayload: balances as any },
      })
    }).catch((e) => errors.push(`Balances: ${e.message}`)),

    syncQBChartOfAccounts(conn.accessToken, conn.realmId).then(async (accounts) => {
      results.coaCount = accounts.length
      if (accounts.length > 0) {
        await prisma.cOAMapping.deleteMany({ where: { organizationId, integrationConnectionId: conn.id } })
        await prisma.cOAMapping.createMany({
          data: accounts.map((a) => ({
            organizationId,
            integrationConnectionId: conn.id,
            externalCode: a.externalCode,
            externalName: a.externalName,
            accountType: a.accountType,
            accountSubType: a.accountSubType ?? null,
            isActive: a.isActive,
          })),
          skipDuplicates: true,
        })
      }
    }).catch((e) => errors.push(`COA: ${e.message}`)),
  ])

  await prisma.integrationConnection.update({
    where: { id: conn.id },
    data: { lastSyncAt: new Date() },
  })

  return { ...results, errors: errors.length > 0 ? errors : undefined }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const result = await runSync(session.user.organizationId)
    const redirect = req.nextUrl.searchParams.get("redirect")
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, req.url))
    }
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const result = await runSync(session.user.organizationId)
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
