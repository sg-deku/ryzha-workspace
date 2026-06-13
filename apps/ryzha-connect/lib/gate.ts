import { prisma } from "@/lib/prisma"

export type Plan = "FREE" | "PRO" | "SCALE"

export const PLAN_LIMITS: Record<Plan, { agents: number; connections: number; users: number }> = {
  FREE:  { agents: 3,   connections: 3,   users: 2  },
  PRO:   { agents: 15,  connections: 15,  users: 10 },
  SCALE: { agents: 999, connections: 999, users: 999 },
}

export const AGENT_PLAN_REQUIREMENTS: Record<string, Plan> = {
  "gl-coding":    "FREE",
  revenue:        "FREE",
  cash:           "FREE",
  ap:             "PRO",
  payroll:        "PRO",
  headcount:      "PRO",
  pipeline:       "PRO",
  commission:     "PRO",
  fx:             "SCALE",
  anomaly:        "PRO",
  collections:    "PRO",
  fpna:           "PRO",
  close:          "PRO",
  compliance:     "PRO",
  "board-report": "PRO",
}

export const FEATURE_PLAN_REQUIREMENTS: Record<string, Plan> = {
  saasMetrics:          "PRO",
  departmentPL:         "PRO",
  deferredRevenue:      "PRO",
  cashForecast:         "PRO",
  budget:               "PRO",
  auditTrail:           "PRO",
  auditorView:          "SCALE",
  multiEntity:          "SCALE",
  fxAutomation:         "SCALE",
  workflows:            "PRO",
  boardReport:          "PRO",
  intercompanyElim:     "SCALE",
}

const PLAN_RANK: Record<Plan, number> = { FREE: 0, PRO: 1, SCALE: 2 }

export function planSatisfies(userPlan: Plan, required: Plan): boolean {
  return PLAN_RANK[userPlan] >= PLAN_RANK[required]
}

export async function getOrgPlan(organizationId: string): Promise<Plan> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true },
  })
  return (org?.plan as Plan) ?? "FREE"
}

export async function checkAgentAccess(
  organizationId: string,
  agentKey: string
): Promise<{ allowed: boolean; required: Plan; current: Plan }> {
  const current = await getOrgPlan(organizationId)
  const required = AGENT_PLAN_REQUIREMENTS[agentKey] ?? "FREE"
  return { allowed: planSatisfies(current, required), required, current }
}

export async function checkFeatureAccess(
  organizationId: string,
  feature: string
): Promise<{ allowed: boolean; required: Plan; current: Plan }> {
  const current = await getOrgPlan(organizationId)
  const required = (FEATURE_PLAN_REQUIREMENTS[feature] as Plan) ?? "FREE"
  return { allowed: planSatisfies(current, required), required, current }
}

export function getConnectionLimit(plan: Plan): number {
  return PLAN_LIMITS[plan].connections
}

export function getAgentLimit(plan: Plan): number {
  return PLAN_LIMITS[plan].agents
}
