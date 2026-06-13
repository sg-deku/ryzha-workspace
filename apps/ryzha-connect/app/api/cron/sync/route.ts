import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { runRevenueAgent } from "@/lib/agents/revenue-agent"
import { runCashAgent } from "@/lib/agents/cash-agent"
import { runAPAgent } from "@/lib/agents/ap-agent"
import { runAnomalyAgent } from "@/lib/agents/anomaly-agent"
import { runGLCodingAgent } from "@/lib/agents/gl-coding-agent"
import { runPipelineAgent } from "@/lib/agents/pipeline-agent"
import { runCommissionAgent } from "@/lib/agents/commission-agent"

async function syncConnectors(organizationId: string) {
  const connections = await prisma.integrationConnection.findMany({
    where: { organizationId, status: "ACTIVE" },
    select: { id: true, provider: true, accessToken: true, refreshToken: true },
  })

  const results: Record<string, unknown> = {}

  for (const conn of connections) {
    try {
      if (conn.provider === "STRIPE_CONNECT" && conn.accessToken) {
        const res = await fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3001"}/api/connect/stripe/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-internal-cron": "1" },
        })
        results.stripe = res.ok ? "synced" : "failed"
      }

      if (conn.provider === "MERCURY" && conn.accessToken) {
        const { pullMercuryTransactions } = await import("@ryzha/integrations")
        const events = await pullMercuryTransactions(conn.accessToken)
        let saved = 0
        for (const ev of events) {
          await prisma.financialEvent.upsert({
            where: { organizationId_source_externalId: { organizationId, source: ev.source, externalId: ev.externalId } },
            create: { organizationId, source: ev.source, externalId: ev.externalId, eventType: ev.eventType as any, amount: ev.amount, currency: ev.currency, rawPayload: ev.rawPayload as any, normalisedData: ev.normalisedData as any },
            update: {},
          }).then(() => saved++).catch(() => {})
        }
        results.mercury = { fetched: events.length, saved }
        await prisma.integrationConnection.update({ where: { id: conn.id }, data: { lastSyncAt: new Date() } })
      }

      if (conn.provider === "RAMP" && conn.accessToken) {
        const { pullRampTransactions } = await import("@ryzha/integrations")
        const events = await pullRampTransactions(conn.accessToken)
        let saved = 0
        for (const ev of events) {
          await prisma.financialEvent.upsert({
            where: { organizationId_source_externalId: { organizationId, source: ev.source, externalId: ev.externalId } },
            create: { organizationId, source: ev.source, externalId: ev.externalId, eventType: ev.eventType as any, amount: ev.amount, currency: ev.currency, rawPayload: ev.rawPayload as any, normalisedData: ev.normalisedData as any },
            update: {},
          }).then(() => saved++).catch(() => {})
        }
        results.ramp = { fetched: events.length, saved }
        await prisma.integrationConnection.update({ where: { id: conn.id }, data: { lastSyncAt: new Date() } })
      }

      if (conn.provider === "GUSTO" && conn.accessToken) {
        const { pullGustoPayrolls } = await import("@ryzha/integrations")
        const companyId = (conn as any).realmId ?? ""
        const events = await pullGustoPayrolls(conn.accessToken, companyId)
        let saved = 0
        for (const ev of events) {
          await prisma.financialEvent.upsert({
            where: { organizationId_source_externalId: { organizationId, source: ev.source, externalId: ev.externalId } },
            create: { organizationId, source: ev.source, externalId: ev.externalId, eventType: ev.eventType as any, amount: ev.amount, currency: ev.currency, rawPayload: ev.rawPayload as any, normalisedData: ev.normalisedData as any },
            update: {},
          }).then(() => saved++).catch(() => {})
        }
        results.gusto = { fetched: events.length, saved }
        await prisma.integrationConnection.update({ where: { id: conn.id }, data: { lastSyncAt: new Date() } })
      }
    } catch (err: any) {
      results[conn.provider.toLowerCase()] = { error: err.message }
    }
  }

  return results
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgs = await prisma.organization.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  })

  const results: Record<string, unknown> = {}

  for (const org of orgs) {
    const orgId = org.id
    try {
      const agentConfig = await getAgentConfig(orgId)

      let connectorSyncResult: unknown = { skipped: true }
      if (agentConfig.connectorsEnabled) {
        try { connectorSyncResult = await syncConnectors(orgId) } catch (e: any) { connectorSyncResult = { error: e.message } }
      }

      let glCodingResult: unknown = { skipped: true }
      if (agentConfig.glCodingEnabled) {
        try { glCodingResult = await runGLCodingAgent(orgId) } catch (e: any) { glCodingResult = { error: e.message } }
      }

      const [revenue, cash, ap, anomaly, pipeline, commission] = await Promise.allSettled([
        agentConfig.revenueEnabled ? runRevenueAgent(orgId) : Promise.resolve({ skipped: true }),
        agentConfig.cashEnabled ? runCashAgent(orgId) : Promise.resolve({ skipped: true }),
        agentConfig.apEnabled ? runAPAgent(orgId) : Promise.resolve({ skipped: true }),
        agentConfig.anomalyEnabled ? runAnomalyAgent(orgId) : Promise.resolve({ skipped: true }),
        agentConfig.pipelineEnabled ? runPipelineAgent(orgId) : Promise.resolve({ skipped: true }),
        agentConfig.commissionEnabled ? runCommissionAgent(orgId) : Promise.resolve({ skipped: true }),
      ])

      results[orgId] = {
        connectors: connectorSyncResult,
        glCoding: glCodingResult,
        revenue: revenue.status === "fulfilled" ? revenue.value : { error: (revenue as any).reason?.message },
        cash: cash.status === "fulfilled" ? cash.value : { error: (cash as any).reason?.message },
        ap: ap.status === "fulfilled" ? ap.value : { error: (ap as any).reason?.message },
        anomaly: anomaly.status === "fulfilled" ? anomaly.value : { error: (anomaly as any).reason?.message },
        pipeline: pipeline.status === "fulfilled" ? pipeline.value : { error: (pipeline as any).reason?.message },
        commission: commission.status === "fulfilled" ? commission.value : { error: (commission as any).reason?.message },
      }
    } catch (err: any) {
      results[orgId] = { error: err.message }
    }
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), results })
}

async function getAgentConfig(organizationId: string) {
  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
    select: { agentConfig: true },
  })
  const config = (settings?.agentConfig as Record<string, boolean> | null) ?? {}
  return {
    connectorsEnabled: config.connectorsEnabled !== false,
    glCodingEnabled: config.glCodingEnabled !== false,
    revenueEnabled: config.revenueEnabled !== false,
    cashEnabled: config.cashEnabled !== false,
    apEnabled: config.apEnabled !== false,
    anomalyEnabled: config.anomalyEnabled !== false,
    pipelineEnabled: config.pipelineEnabled !== false,
    commissionEnabled: config.commissionEnabled !== false,
  }
}
