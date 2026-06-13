import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { ProviderGrid } from "@/components/connect/provider-grid"

async function getData(organizationId: string) {
  const conns = await prisma.integrationConnection.findMany({
    where: { organizationId },
    include: {
      syncLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      coaMappings: { where: { isActive: true }, select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const qbConn = conns.find((c) => c.provider === "QUICKBOOKS")
  const qbConfigured = !!(
    process.env.QB_CLIENT_ID ||
    (qbConn?.scope && (() => { try { return JSON.parse(qbConn.scope!).clientId } catch { return null } })())
  )

  const connections = conns.map((c) => ({
    provider: c.provider,
    status: c.status as "ACTIVE" | "EXPIRED" | "DISCONNECTED" | "ERROR",
    lastSyncAt: c.lastSyncAt,
    expiresAt: c.expiresAt,
    realmId: c.realmId,
    tenantId: c.tenantId,
    displayName: c.displayName,
    errorMessage: c.errorMessage,
    coaCount: c.coaMappings.length,
    lastOperation: c.syncLogs[0]
      ? { status: c.syncLogs[0].status, direction: c.syncLogs[0].direction }
      : null,
  }))

  return { connections, qbConfigured }
}

export default async function ConnectPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const { connections, qbConfigured } = await getData(session.user.organizationId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Connections</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Click any platform to configure and connect. Ryzha normalises events and pushes clean data to your accounting system.
        </p>
      </div>

      <ProviderGrid connections={connections} qbConfigured={qbConfigured} organizationId={session.user.organizationId} />
    </div>
  )
}
