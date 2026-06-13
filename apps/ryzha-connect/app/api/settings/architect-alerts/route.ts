import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

interface ArchitectAlert {
  id: string
  severity: "HIGH" | "MEDIUM" | "LOW"
  title: string
  description: string
  action: string
  actionHref: string
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const [architecture, recentEvents, connections] = await Promise.all([
    prisma.financialArchitecture.findUnique({
      where: { organizationId },
      select: { entities: true, departmentStructure: true, revenueRecognition: true, dataFlowMap: true },
    }),
    prisma.financialEvent.findMany({
      where: { organizationId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
      select: { currency: true, source: true, eventType: true, normalisedData: true },
      take: 500,
    }),
    prisma.integrationConnection.findMany({
      where: { organizationId, status: "ACTIVE" },
      select: { provider: true },
    }),
  ])

  const alerts: ArchitectAlert[] = []

  if (!architecture) {
    alerts.push({
      id: "no-arch",
      severity: "HIGH",
      title: "Architecture not configured",
      description: "No financial architecture has been set up. The AI agents cannot apply revenue recognition or cost allocation without it.",
      action: "Set up architecture",
      actionHref: "/settings/architect",
    })
    return NextResponse.json(alerts)
  }

  const configuredCurrencies = new Set<string>(
    ((architecture.entities as any[]) ?? []).map((e: any) => e.currency?.toUpperCase()).filter(Boolean)
  )
  configuredCurrencies.add("USD")

  const seenCurrencies = new Set(recentEvents.map((e) => e.currency?.toUpperCase()).filter(Boolean))
  const newCurrencies = [...seenCurrencies].filter((c) => !configuredCurrencies.has(c))
  if (newCurrencies.length > 0) {
    alerts.push({
      id: "new-currency",
      severity: "HIGH",
      title: `New currencies detected: ${newCurrencies.join(", ")}`,
      description: `Recent events contain currencies not in your entity configuration (${newCurrencies.join(", ")}). The FX Agent needs these added to properly revalue foreign positions.`,
      action: "Update entities & currencies",
      actionHref: "/settings/architect",
    })
  }

  const activeProviders = new Set(connections.map((c) => c.provider))
  const configuredAccSystem = (architecture.dataFlowMap as any)?.accountingSystem
  const hasQB = activeProviders.has("QUICKBOOKS")
  const hasXero = activeProviders.has("XERO")
  if (!hasQB && !hasXero && configuredAccSystem) {
    alerts.push({
      id: "no-accounting",
      severity: "HIGH",
      title: "Accounting system disconnected",
      description: "Your architecture specifies an accounting system but no active ERP connection exists. Journal entries cannot be pushed.",
      action: "Reconnect accounting system",
      actionHref: "/connect",
    })
  }

  const departments = (architecture.departmentStructure as any)?.departments ?? []
  const eventDepts = recentEvents
    .map((e) => (e.normalisedData as any)?.department ?? (e.normalisedData as any)?.costCenter)
    .filter(Boolean) as string[]

  const unmappedDepts = [...new Set(eventDepts)].filter(
    (d) => !departments.some((dept: string) => dept.toLowerCase() === d.toLowerCase())
  )
  if (unmappedDepts.length > 0) {
    alerts.push({
      id: "unmapped-dept",
      severity: "MEDIUM",
      title: `Unmapped departments: ${unmappedDepts.slice(0, 3).join(", ")}`,
      description: `Events reference departments not in your P&L structure. These will fall into "G&A" by default rather than their correct cost centre.`,
      action: "Add departments",
      actionHref: "/settings/architect",
    })
  }

  const hasMultiEntity = ((architecture.entities as any[]) ?? []).length > 1
  const hasIntercompanyEvents = recentEvents.some(
    (e) => (e.normalisedData as any)?.intercompany === true
  )
  if (hasIntercompanyEvents && !hasMultiEntity) {
    alerts.push({
      id: "multi-entity",
      severity: "MEDIUM",
      title: "Intercompany transactions detected",
      description: "Events are flagged as intercompany but only one entity is configured. Add your subsidiary entities to enable proper consolidation and elimination.",
      action: "Add legal entities",
      actionHref: "/settings/architect",
    })
  }

  const revRecPolicy = (architecture.revenueRecognition as any)?.defaultPolicy
  const hasSubscriptionEvents = recentEvents.some(
    (e) => e.eventType === "SUBSCRIPTION_CREATED" || e.eventType === "SUBSCRIPTION_UPDATED"
  )
  if (hasSubscriptionEvents && revRecPolicy === "point_in_time") {
    alerts.push({
      id: "rev-rec-mismatch",
      severity: "MEDIUM",
      title: "Revenue recognition policy may need updating",
      description: "Subscription events detected but your policy is set to point-in-time recognition. SaaS subscriptions should typically use ratable recognition over the contract term.",
      action: "Review revenue policy",
      actionHref: "/settings/architect",
    })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000)
  const recentNewSources = [...new Set(recentEvents.map((e) => e.source))]
  const configuredSources = [
    (architecture.dataFlowMap as any)?.revenue,
    (architecture.dataFlowMap as any)?.payroll,
    (architecture.dataFlowMap as any)?.expenses,
    (architecture.dataFlowMap as any)?.banking,
  ].filter(Boolean)

  const unknownSources = recentNewSources.filter(
    (s) => !configuredSources.some((cs: string) => cs?.toLowerCase() === s?.toLowerCase())
  )
  if (unknownSources.length > 0) {
    alerts.push({
      id: "unknown-sources",
      severity: "LOW",
      title: `New data sources: ${unknownSources.join(", ")}`,
      description: `Events are arriving from platforms not mapped in your architecture data flow. Update your architecture to specify the role of each source.`,
      action: "Update data flow map",
      actionHref: "/settings/architect",
    })
  }

  return NextResponse.json(alerts)
}
