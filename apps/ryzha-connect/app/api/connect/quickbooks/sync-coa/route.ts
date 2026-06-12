import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { syncQBChartOfAccounts } from "@ryzha/integrations"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const connection = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
  })

  if (!connection || connection.status !== "ACTIVE") {
    return NextResponse.json({ error: "No active QuickBooks connection" }, { status: 400 })
  }

  try {
    const accounts = await syncQBChartOfAccounts(connection.accessToken, connection.realmId!)

    await prisma.cOAMapping.deleteMany({
      where: { organizationId, integrationConnectionId: connection.id },
    })

    if (accounts.length > 0) {
      await prisma.cOAMapping.createMany({
        data: accounts.map((a) => ({
          organizationId,
          integrationConnectionId: connection.id,
          externalCode: a.externalCode,
          externalName: a.externalName,
          accountType: a.accountType,
          accountSubType: a.accountSubType ?? null,
          isActive: a.isActive,
        })),
        skipDuplicates: true,
      })
    }

    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    })

    return NextResponse.redirect(
      new URL(`/settings/integrations?coa_synced=${accounts.length}`, req.url)
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
