import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider")
  if (!provider) return NextResponse.json({ error: "Missing provider" }, { status: 400 })
  return POST(new Request(req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider }),
  }))
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { provider } = body

  if (!provider) return NextResponse.json({ error: "Missing provider" }, { status: 400 })

  const organizationId = session.user.organizationId

  const conn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider } },
    select: { id: true, provider: true, status: true, accessToken: true, refreshToken: true, realmId: true },
  })

  if (!conn) return NextResponse.json({ error: "Connection not found" }, { status: 404 })
  if (conn.status !== "ACTIVE") return NextResponse.json({ error: "Connection is not active" }, { status: 400 })

  try {
    let result: unknown = { skipped: true }

    if (provider === "STRIPE_CONNECT" && conn.accessToken) {
      const res = await fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3001"}/api/connect/stripe/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-cron": "1" },
      })
      result = res.ok ? { synced: true } : { error: "Stripe sync failed" }
    } else if (provider === "MERCURY" && conn.accessToken) {
      const { pullMercuryTransactions } = await import("@ryzha/integrations")
      const events = await pullMercuryTransactions(conn.accessToken)
      result = { fetched: events.length }
    } else if (provider === "RAMP" && conn.accessToken) {
      const { pullRampTransactions } = await import("@ryzha/integrations")
      const events = await pullRampTransactions(conn.accessToken)
      result = { fetched: events.length }
    } else if (provider === "GUSTO" && conn.accessToken) {
      const { pullGustoPayrolls } = await import("@ryzha/integrations")
      const events = await pullGustoPayrolls(conn.accessToken, conn.realmId ?? "")
      result = { fetched: events.length }
    } else if (provider === "QUICKBOOKS") {
      const { pullQBARAging } = await import("@ryzha/integrations")
      const qbConn = await prisma.integrationConnection.findUnique({
        where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
        select: { accessToken: true, realmId: true },
      })
      if (!qbConn?.accessToken || !qbConn?.realmId) throw new Error("QuickBooks not fully connected")
      result = await pullQBARAging(qbConn.accessToken, qbConn.realmId)
    } else {
      result = { message: "Manual sync not supported for this provider" }
    }

    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: new Date() },
    })

    return NextResponse.json({ ok: true, provider, result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Sync failed" }, { status: 500 })
  }
}
