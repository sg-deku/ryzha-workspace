import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

const AGENT_KEYS = [
  "gl-coding", "revenue", "cash", "ap", "payroll", "headcount",
  "pipeline", "commission", "fx", "anomaly", "collections",
  "fpna", "close", "compliance", "board-report",
]

const AGENT_NAME_MAP: Record<string, string> = {
  "gl-coding":    "GL",
  revenue:        "Revenue",
  cash:           "Cash",
  ap:             "AP",
  payroll:        "Payroll",
  headcount:      "Headcount",
  pipeline:       "Pipeline",
  commission:     "Commission",
  fx:             "FX",
  anomaly:        "Anomaly",
  collections:    "Collections",
  fpna:           "FP&A",
  close:          "Close",
  compliance:     "Compliance",
  "board-report": "BoardReport",
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const results = await Promise.all(
    AGENT_KEYS.map(async (key) => {
      const agentName = AGENT_NAME_MAP[key] ?? key

      const [latest, count] = await Promise.all([
        prisma.aIDecisionLog.findFirst({
          where: { organizationId, agentName: { contains: agentName, mode: "insensitive" } },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, reasoning: true },
        }),
        prisma.aIDecisionLog.count({
          where: { organizationId, agentName: { contains: agentName, mode: "insensitive" } },
        }),
      ])

      return {
        agentKey: key,
        lastRunAt: latest?.createdAt?.toISOString() ?? null,
        lastStatus: latest ? "ok" : "never" as const,
        lastError: null as string | null,
        decisionCount: count,
      }
    })
  )

  return NextResponse.json(results)
}
