import { prisma } from "@/lib/prisma"
import { callAI } from "@/lib/ai-client"

export interface ComplianceAgentResult {
  processed: number
  compliant: number
  violations: number
  findings: ComplianceFinding[]
  errors: string[]
}

export interface ComplianceFinding {
  type: "REV_REC_VIOLATION" | "POLICY_BREACH" | "MISSING_GL_CODE" | "DUPLICATE_ENTRY" | "UNAPPROVED_EXPENSE"
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  description: string
  eventId?: string
  recommendation: string
}

export async function runComplianceAgent(organizationId: string): Promise<ComplianceAgentResult> {
  const result: ComplianceAgentResult = {
    processed: 0,
    compliant: 0,
    violations: 0,
    findings: [],
    errors: [],
  }

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [architecture, policies, events] = await Promise.all([
    prisma.financialArchitecture.findUnique({ where: { organizationId } }),
    (prisma.policyRule as any).findMany({ where: { organizationId, isActive: true } }),
    prisma.financialEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth },
      },
      take: 200,
      orderBy: { createdAt: "desc" },
      include: {
        aiDecisionLogs: { take: 1, orderBy: { createdAt: "desc" } },
      },
    }),
  ])

  result.processed = events.length

  const postedRevEvents = events.filter(
    (e) => ["PAYMENT_RECEIVED", "INVOICE_PAID"].includes(e.eventType) && e.status === "POSTED"
  )

  for (const event of postedRevEvents) {
    const hasGLCode = (event.normalisedData as any)?.glAccountCode
    if (!hasGLCode) {
      result.findings.push({
        type: "MISSING_GL_CODE",
        severity: "MEDIUM",
        description: `Revenue event ${event.externalId} posted without a GL account code assigned`,
        eventId: event.id,
        recommendation: "Re-run the GL Coding agent or manually assign an account code in the event detail view",
      })
      result.violations++
    } else {
      result.compliant++
    }
  }

  const revRecPolicy = (architecture?.revenueRecognition as any)?.defaultPolicy ?? "ratable"
  const deferredEvents = events.filter(
    (e) => e.status === "POSTED" && (e.normalisedData as any)?.deferred > 0
  )
  for (const event of deferredEvents) {
    if (revRecPolicy === "point_in_time") {
      result.findings.push({
        type: "REV_REC_VIOLATION",
        severity: "HIGH",
        description: `Event ${event.externalId} has deferred revenue but architecture specifies point-in-time recognition`,
        eventId: event.id,
        recommendation: "Review the revenue recognition policy in Architecture settings and re-process this event",
      })
      result.violations++
    }
  }

  const seenSignatures = new Map<string, string>()
  for (const event of events) {
    const sig = `${event.source}:${event.eventType}:${event.amount}:${event.externalId}`
    if (seenSignatures.has(sig)) {
      result.findings.push({
        type: "DUPLICATE_ENTRY",
        severity: "HIGH",
        description: `Possible duplicate: event ${event.externalId} from ${event.source} matches an existing event`,
        eventId: event.id,
        recommendation: "Review both events and reject the duplicate in the Staging Queue",
      })
      result.violations++
    } else {
      seenSignatures.set(sig, event.id)
    }
  }

  const unapprovedExpenses = events.filter(
    (e) =>
      ["EXPENSE_CREATED", "BILL_CREATED"].includes(e.eventType) &&
      e.status === "POSTED" &&
      (e.amount ?? 0) > 5000
  )

  for (const event of unapprovedExpenses) {
    const hasApprovalLog = (event.aiDecisionLogs as any[])[0]?.decisionType === "AP_APPROVAL"
    if (!hasApprovalLog) {
      result.findings.push({
        type: "UNAPPROVED_EXPENSE",
        severity: "MEDIUM",
        description: `Expense ${event.externalId} for ${event.amount} was posted without recorded AP approval`,
        eventId: event.id,
        recommendation: "Verify the approval exists in your AP system, or update the AP policy to require approval for this amount",
      })
      result.violations++
    }
  }

  if (events.length > 10 && result.findings.length > 0) {
    try {
      const summary = result.findings.slice(0, 5).map((f) => `${f.type}: ${f.description}`).join("\n")
      const aiResponse = await callAI(organizationId, [
        {
          role: "system",
          content: `You are a compliance auditor reviewing financial data. Given these compliance findings, provide a brief executive summary (2-3 sentences) of the key risks and recommended actions. Be concise and direct.`,
        },
        {
          role: "user",
          content: `Compliance findings for this month:\n${summary}\n\nTotal: ${result.violations} violations out of ${result.processed} events.`,
        },
      ], {
        feature: "agent_compliance",
        maxTokens: 250,
      })

      await prisma.aIDecisionLog.create({
        data: {
          organizationId,
          agentName: "Compliance",
          decisionType: "COMPLIANCE_REVIEW",
          inputSummary: { processed: result.processed, violations: result.violations } as any,
          output: { findings: result.findings.length, summary: aiResponse.content } as any,
          confidence: 0.9,
          reasoning: aiResponse.content,
        },
      }).catch(() => {})
    } catch {
    }
  }

  if (result.violations > 0) {
    const criticalCount = result.findings.filter((f) => f.severity === "CRITICAL" || f.severity === "HIGH").length
    if (criticalCount > 0) {
      await prisma.notification.create({
        data: {
          organizationId,
          type: "ERROR",
          title: `${criticalCount} High-Severity Compliance Finding${criticalCount > 1 ? "s" : ""}`,
          message: `Monthly compliance review found ${result.violations} violation${result.violations > 1 ? "s" : ""} including ${criticalCount} high/critical severity issues requiring immediate attention.`,
          link: "/close",
        },
      }).catch(() => {})
    }
  }

  return result
}
