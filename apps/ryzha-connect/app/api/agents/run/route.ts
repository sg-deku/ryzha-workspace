import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

const AGENT_RUNNERS: Record<string, string> = {
  "gl-coding":   "@/lib/agents/gl-coding-agent",
  revenue:       "@/lib/agents/revenue-agent",
  cash:          "@/lib/agents/cash-agent",
  ap:            "@/lib/agents/ap-agent",
  anomaly:       "@/lib/agents/anomaly-agent",
  payroll:       "@/lib/agents/payroll-agent",
  fx:            "@/lib/agents/fx-agent",
  headcount:     "@/lib/agents/headcount-agent",
  collections:   "@/lib/agents/collections-agent",
  pipeline:      "@/lib/agents/pipeline-agent",
  commission:    "@/lib/agents/commission-agent",
  close:         "@/lib/agents/close-agent",
  "board-report": "@/lib/agents/board-report-agent",
  compliance:    "@/lib/agents/compliance-agent",
  fpna:          "@/lib/agents/fpna-agent",
}

const RUNNER_FNAMES: Record<string, string> = {
  "gl-coding":   "runGLCodingAgent",
  revenue:       "runRevenueAgent",
  cash:          "runCashAgent",
  ap:            "runAPAgent",
  anomaly:       "runAnomalyAgent",
  payroll:       "runPayrollAgent",
  fx:            "runFXAgent",
  headcount:     "runHeadcountAgent",
  collections:   "runCollectionsAgent",
  pipeline:      "runPipelineAgent",
  commission:    "runCommissionAgent",
  close:         "runCloseAgent",
  "board-report": "runBoardReportAgent",
  compliance:    "runComplianceAgent",
  fpna:          "runFPnAAgent",
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { agent } = body

  const organizationId = session.user.organizationId

  if (agent === "connector-sync") {
    try {
      const { prisma } = await import("@/lib/prisma")
      const { runStripeSync } = await import("@/lib/stripe-sync")
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

  if (!AGENT_RUNNERS[agent]) {
    return NextResponse.json(
      { error: `Unknown agent "${agent}". Valid: connector-sync, ${Object.keys(AGENT_RUNNERS).join(", ")}` },
      { status: 400 }
    )
  }

  try {
    const mod = await import(AGENT_RUNNERS[agent] as any)
    const fn = mod[RUNNER_FNAMES[agent]]
    if (typeof fn !== "function") throw new Error(`Runner function not found in module`)

    if (agent === "gl-coding") {
      const result = await fn(organizationId)
      const revenueModule = await import("@/lib/agents/revenue-agent")
      const revenueResult = await revenueModule.runRevenueAgent(organizationId)
      return NextResponse.json({ ok: true, agent, ranAt: new Date().toISOString(), result, followUp: { revenue: revenueResult } })
    }

    const result = await fn(organizationId)
    return NextResponse.json({ ok: true, agent, ranAt: new Date().toISOString(), result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Agent run failed" }, { status: 500 })
  }
}
