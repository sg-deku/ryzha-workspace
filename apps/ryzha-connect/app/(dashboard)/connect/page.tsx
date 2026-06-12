import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { ProviderGrid } from "@/components/connect/provider-grid"

async function getData(organizationId: string) {
  const conns = await prisma.integrationConnection.findMany({
    where: { organizationId },
    select: { provider: true, status: true, lastSyncAt: true, scope: true },
  })

  const connections = conns.map((c) => ({
    provider: c.provider,
    status: c.status as "ACTIVE" | "EXPIRED" | "DISCONNECTED" | "ERROR",
    lastSyncAt: c.lastSyncAt,
  }))

  const qbConn = conns.find((c) => c.provider === "QUICKBOOKS")
  const qbConfigured = !!(
    process.env.QB_CLIENT_ID ||
    (qbConn?.scope && (() => { try { return JSON.parse(qbConn.scope!).clientId } catch { return null } })())
  )

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

      <ProviderGrid connections={connections} qbConfigured={qbConfigured} />
    </div>
  )
}
