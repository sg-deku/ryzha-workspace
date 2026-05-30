import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"

export interface P2PAuditResult {
  auditStatus: "verified" | "flagged"
  riskScore: number
  findings: string[]
  aiReasoning: string
  message: string
}

export async function runP2PAuditorAgent(
  vendorPaymentId: string,
  organizationId: string,
  priorContext: {
    threeWayMatchStatus: string
    duplicateStatus: string
    apPolicyStatus: string
    apPolicyNotes: string
  }
): Promise<P2PAuditResult> {
  const payment = await prisma.vendorPayment.findUnique({
    where: { id: vendorPaymentId },
    include: {
      vendorInvoice: {
        include: {
          vendor: { select: { name: true, createdAt: true } },
          purchaseOrder: { select: { poNumber: true, status: true } },
        },
      },
    },
  })

  if (!payment) {
    return {
      auditStatus: "flagged",
      riskScore: 100,
      findings: ["Payment record not found"],
      aiReasoning: "",
      message: "P2P Audit FAILED — payment record not found.",
    }
  }

  const invoice = payment.vendorInvoice
  const vendor = invoice.vendor

  const vendorAgeDays = Math.floor(
    (Date.now() - new Date(vendor.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  const recentPaymentsToVendor = await prisma.vendorPayment.count({
    where: {
      organizationId,
      vendorInvoice: { vendorId: (invoice as any).vendorId },
      paymentDate: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    },
  })

  let auditStatus: "verified" | "flagged" = "verified"
  const findings: string[] = []
  let riskScore = 0
  let aiReasoning = ""

  if (priorContext.duplicateStatus === "DUPLICATE") {
    findings.push("Duplicate payment detected — blocked by prior agent")
    riskScore += 80
  }

  if (priorContext.threeWayMatchStatus === "FAIL") {
    findings.push("Three-way match failed — invoice not in payable state or over-payment")
    riskScore += 60
  }

  if (vendorAgeDays < 30) {
    findings.push(`New vendor — created ${vendorAgeDays} day(s) ago. First-payment scrutiny applies.`)
    riskScore += 30
  }

  if (payment.amount > 10000 && recentPaymentsToVendor === 0) {
    findings.push(`High-value first payment ($${payment.amount}) to vendor with no prior payment history.`)
    riskScore += 25
  }

  if (!invoice.purchaseOrderId) {
    findings.push("No PO linked — payment lacks formal procurement authorization.")
    riskScore += 15
  }

  try {
    const response = await callLLM(
      organizationId,
      [
        {
          role: "system",
          content: `You are a SOX-compliance AP auditor. Review this vendor payment for financial control risks.
Respond with JSON: { "risk_score_adjustment": number, "findings": string[], "reasoning": string, "recommend_flag": boolean }
risk_score_adjustment: -20 to +40 adjustment to the current risk score.
findings: array of specific compliance observations (max 3).
reasoning: 1-2 sentence SOX control assessment.
recommend_flag: true only if there are serious control violations.`,
        },
        {
          role: "user",
          content: `Vendor: ${vendor.name} (${vendorAgeDays} days old, ${recentPaymentsToVendor} payments in 90 days)
Invoice: ${invoice.invoiceNumber} | Amount: $${payment.amount} | Method: ${payment.method}
PO: ${invoice.purchaseOrder?.poNumber ?? "none"} | PO Status: ${invoice.purchaseOrder?.status ?? "n/a"}
Prior checks — Three-way match: ${priorContext.threeWayMatchStatus} | Duplicate: ${priorContext.duplicateStatus} | AP Policy: ${priorContext.apPolicyStatus}
AP Notes: ${priorContext.apPolicyNotes}
Current risk score: ${riskScore}`,
        },
      ],
      "agent_p2p_auditor",
      { temperature: 0 }
    )

    const parsed = parseAIJson(response.content as string)
    riskScore = Math.max(0, Math.min(100, riskScore + (parsed.risk_score_adjustment ?? 0)))
    aiReasoning = parsed.reasoning ?? ""
    if (parsed.findings?.length) {
      findings.push(...parsed.findings.slice(0, 3))
    }
    if (parsed.recommend_flag) {
      auditStatus = "flagged"
    }
  } catch (e) {
    console.error("[P2PAuditor] AI assessment failed", e)
    aiReasoning = "AI assessment unavailable — rule-based audit applied."
  }

  if (riskScore >= 60) {
    auditStatus = "flagged"
  }

  const status = auditStatus === "verified" ? "VERIFIED" : "FLAGGED"
  const findingsSummary = findings.length > 0 ? ` Findings: ${findings.join("; ")}.` : " No significant findings."

  return {
    auditStatus,
    riskScore,
    findings,
    aiReasoning,
    message: `P2P Audit ${status}. Risk score: ${riskScore}/100.${findingsSummary}${aiReasoning ? ` ${aiReasoning}` : ""}`,
  }
}
