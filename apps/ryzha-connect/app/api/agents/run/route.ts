import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { runGLCodingAgent } from "@/lib/agents/gl-coding-agent"
import { runRevenueAgent } from "@/lib/agents/revenue-agent"
import { runCashAgent } from "@/lib/agents/cash-agent"
import { runAPAgent } from "@/lib/agents/ap-agent"
import { runAnomalyAgent } from "@/lib/agents/anomaly-agent"
import { runPayrollAgent } from "@/lib/agents/payroll-agent"
import { runFXAgent } from "@/lib/agents/fx-agent"
import { runHeadcountAgent } from "@/lib/agents/headcount-agent"
import { runCollectionsAgent } from "@/lib/agents/collections-agent"
import { runPipelineAgent } from "@/lib/agents/pipeline-agent"
import { runCommissionAgent } from "@/lib/agents/commission-agent"
import { runCloseAgent } from "@/lib/agents/close-agent"
import { runBoardReportAgent } from "@/lib/agents/board-report-agent"
import { runComplianceAgent } from "@/lib/agents/compliance-agent"
import { runFPnAAgent } from "@/lib/agents/fpna-agent"
import { runStripeSync } from "@/lib/stripe-sync"
import { prisma } from "@/lib/prisma"
import { checkAgentAccess } from "@/lib/gate"

type AgentRunner = (organizationId: string) => Promise<unknown>

const AGENT_MAP: Record<string, AgentRunner> = {
  "gl-coding":    runGLCodingAgent,
  revenue:        runRevenueAgent,
  cash:           runCashAgent,
  ap:             runAPAgent,
  anomaly:        runAnomalyAgent,
  payroll:        runPayrollAgent,
  fx:             runFXAgent,
  headcount:      runHeadcountAgent,
  collections:    runCollectionsAgent,
  pipeline:       runPipelineAgent,
  commission:     runCommissionAgent,
  close:          runCloseAgent,
  "board-report": runBoardReportAgent,
  compliance:     runComplianceAgent,
  fpna:           runFPnAAgent,
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { agent } = body
  const organizationId = session.user.organizationId

  if (agent === "connector-sync") {
    try {
      const connections = await prisma.integrationConnection.findMany({
        where: { organizationId, status: "ACTIVE" },
        select: { id: true, provider: true, accessToken: true, realmId: true },
      })
      const syncResults: Record<string, unknown> = {}
      for (const conn of connections) {
        try {
          if (conn.provider === "STRIPE_CONNECT" && conn.accessToken) {
            syncResults.stripe = await runStripeSync(organizationId, 90)
          } else if (conn.provider === "MERCURY" && conn.accessToken) {
            const { pullMercuryTransactions } = await import("@ryzha/integrations")
            const evs = await pullMercuryTransactions(conn.accessToken)
            syncResults.mercury = { fetched: evs.length }
          } else if (conn.provider === "RAMP" && conn.accessToken) {
            const { pullRampTransactions } = await import("@ryzha/integrations")
            const evs = await pullRampTransactions(conn.accessToken)
            syncResults.ramp = { fetched: evs.length }
          } else if (conn.provider === "GUSTO" && conn.accessToken) {
            const { pullGustoPayrolls } = await import("@ryzha/integrations")
            const evs = await pullGustoPayrolls(conn.accessToken, conn.realmId ?? "")
            syncResults.gusto = { fetched: evs.length }
          }
        } catch (e: any) {
          syncResults[conn.provider.toLowerCase()] = { error: e.message }
        }
      }
      return NextResponse.json({ ok: true, agent, ranAt: new Date().toISOString(), result: syncResults })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  const runner = AGENT_MAP[agent]
  if (!runner) {
    return NextResponse.json(
      { error: `Unknown agent "${agent}". Valid: connector-sync, ${Object.keys(AGENT_MAP).join(", ")}` },
      { status: 400 }
    )
  }

  const access = await checkAgentAccess(organizationId, agent)
  if (!access.allowed) {
    return NextResponse.json(
      {
        error: `Agent "${agent}" requires the ${access.required} plan. Your current plan: ${access.current}. Upgrade at /settings/billing.`,
        upgradeRequired: true,
        required: access.required,
        current: access.current,
      },
      { status: 403 }
    )
  }

  try {
    if (agent === "gl-coding") {
      const result = await runGLCodingAgent(organizationId)
      const revenueResult = await runRevenueAgent(organizationId)
      return NextResponse.json({ ok: true, agent, ranAt: new Date().toISOString(), result, followUp: { revenue: revenueResult } })
    }

    const result = await runner(organizationId)
    return NextResponse.json({ ok: true, agent, ranAt: new Date().toISOString(), result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Agent run failed" }, { status: 500 })
  }
}
