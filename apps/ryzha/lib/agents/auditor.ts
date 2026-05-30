import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"
import { appendAgentLog } from "./utils"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"

export async function runAuditorAgent(transactionId: string) {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      organization: {
        include: { financialSettings: true }
      }
    }
  })
  if (!tx) return null

  const settings = tx.organization.financialSettings
  const requireAuditSeal = settings?.requireAuditSeal ?? true
  const autoReject = settings?.autoRejectUnverified ?? false
  const anomalyThreshold = settings?.anomalyThreshold ?? 50000

  let auditStatus = "failed"
  let auditHash = null
  let logMessage = ""
  let anomalyDetected = false
  let aiReasoning = ""
  let riskScore = 0

  // 1. Parallel behavioral pre-checks
  const [duplicateCount, recentTxCount] = await Promise.all([
    prisma.transaction.count({
      where: {
        stripePaymentIntentId: tx.stripePaymentIntentId,
        organizationId: tx.organizationId,
        id: { not: transactionId }
      }
    }),
    prisma.transaction.count({
      where: {
        customerEmail: tx.customerEmail ?? undefined,
        organizationId: tx.organizationId,
        createdAt: { gte: new Date(Date.now() - 86_400_000) },
        id: { not: transactionId }
      }
    })
  ])

  const nearThreshold = anomalyThreshold > 0 && Math.abs(tx.amount - anomalyThreshold) / anomalyThreshold < 0.05
  const isRoundDollar = tx.amount > 0 && tx.amount % 100 === 0

  // Hard-stop on duplicate Payment Intent — prevents double-counting revenue
  if (duplicateCount > 0) {
    const logMsg = `Auditor: DUPLICATE DETECTED — ${duplicateCount} other transaction(s) share Payment Intent ${tx.stripePaymentIntentId}. Flagged to prevent double-counting revenue.`
    await appendAgentLog(transactionId, "Auditor", logMsg)
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { auditStatus: "flagged", auditHash: null }
    })
    await postSuspenseJE(tx, transactionId)
    return await prisma.transaction.findUnique({ where: { id: transactionId } })
  }

  // Behavioral anomaly signals
  if (tx.amount > anomalyThreshold) anomalyDetected = true
  if (recentTxCount >= 5) anomalyDetected = true
  if (nearThreshold) anomalyDetected = true

  // 2. MSA-aware contract lookup — exact PI match first, then customer MSA fallback
  let contract = await prisma.contract.findFirst({
    where: {
      stripePaymentIntentId: tx.stripePaymentIntentId,
      organizationId: tx.organizationId
    }
  })
  let contractMatchType: "exact" | "msa" | "none" = contract ? "exact" : "none"

  if (!contract && tx.customerEmail) {
    contract = await prisma.contract.findFirst({
      where: {
        customerEmail: tx.customerEmail,
        organizationId: tx.organizationId,
        status: "signed"
      },
      orderBy: { signedAt: "desc" }
    })
    if (contract) contractMatchType = "msa"
  }

  // 3. AI forensic reasoning with SOX + ASC 606 context
  try {
    const response = await callLLM(tx.organizationId, [
      {
        role: "system",
        content: `You are a forensic auditor for a US company applying SOX Section 404 internal controls and ASC 606 revenue recognition standards.
Investigate this transaction for anomalies using these criteria:
- Round dollar amounts (e.g. $5000.00, $10000.00) — common in fraudulent override scenarios
- Amounts within 5% of the approval threshold ($${anomalyThreshold}) — threshold-gaming red flag
- High-velocity: 5+ transactions from the same customer in the past 24 hours
- Transaction description inconsistent with expected revenue type for a SaaS/services company
- ASC 606 checklist: (1) enforceable contract exists? (2) distinct performance obligation? (3) transaction price determinable? (4) collection probable?
- SOX Section 404: segregation of duties, unusual timing, related-party indicators
Organization context: anomaly threshold $${anomalyThreshold} | currency ${tx.currency?.toUpperCase() ?? "USD"} | contract match: ${contractMatchType}
Respond ONLY with JSON: { "is_anomaly": boolean, "risk_score": number (0-100), "investigation_notes": string, "asc606_flags": string[] }`
      },
      {
        role: "user",
        content: `Transaction: ${tx.description ?? "(no description)"} | Amount: $${tx.amount} | Customer: ${tx.customerEmail ?? "unknown"} | Recent 24h txns from same customer: ${recentTxCount} | Round dollar: ${isRoundDollar} | Near threshold: ${nearThreshold} | Duplicate PI found: false`
      }
    ], "agent_auditor", { temperature: 0 })

    try {
      const result = parseAIJson(response.content as string)
      if (result.is_anomaly) anomalyDetected = true
      riskScore = result.risk_score ?? 0
      aiReasoning = result.investigation_notes ?? ""
      if (result.asc606_flags?.length > 0) {
        aiReasoning += ` ASC 606 flags: ${result.asc606_flags.join("; ")}.`
      }
    } catch (e) {
      console.error("[auditor] AI response parse failed", e)
    }
  } catch (error) {
    console.error("[auditor] AI call failed", error)
  }

  // 4. Determine audit status
  if (contract && contract.status === "signed") {
    auditStatus = "verified"

    // Strong audit hash — full fingerprint, not just contractId + amount
    auditHash = crypto.createHash("sha256")
      .update([
        tx.id,
        tx.stripePaymentIntentId,
        tx.amount.toString(),
        tx.customerEmail ?? "",
        contract.id,
        contract.status,
        contractMatchType,
        tx.organizationId,
        new Date().toISOString().slice(0, 13)
      ].join("|"))
      .digest("hex")

    const matchNote = contractMatchType === "msa"
      ? `Matched via MSA (customer email) — contract ${contract.id.slice(-6)}`
      : `Exact PI match — contract ${contract.id.slice(-6)}`

    logMessage = `Auditor: Audit seal verified. ${matchNote}. Hash: ${auditHash.slice(0, 8)}... Risk score: ${riskScore}/100.`

    if (anomalyDetected) {
      logMessage += ` WARNING: ${aiReasoning || "Unusual transaction pattern detected. Manual review recommended."}`
    }

    if (recentTxCount >= 5) {
      logMessage += ` VELOCITY ALERT: ${recentTxCount} transactions from ${tx.customerEmail ?? "this customer"} in the past 24 hours.`
    }
    if (nearThreshold) {
      logMessage += ` THRESHOLD PROXIMITY: Amount $${tx.amount} is within 5% of the $${anomalyThreshold} approval threshold — possible threshold-gaming.`
    }
  } else {
    auditStatus = autoReject ? "rejected" : (requireAuditSeal ? "flagged" : "unverified")
    logMessage = `Auditor: Verification failed — no matching signed contract found for ${tx.description ?? tx.stripePaymentIntentId} (checked exact PI and MSA fallback for ${tx.customerEmail ?? "unknown customer"}).`
    if (aiReasoning) logMessage += ` AI investigation: ${aiReasoning}`
    if (requireAuditSeal) logMessage += ` Revenue held in suspense pending manual contract linkage.`
  }

  await appendAgentLog(transactionId, "Auditor", logMessage)

  // 5. Post suspense JE for flagged/rejected — holds revenue off the P&L until cleared
  if (auditStatus === "flagged" || auditStatus === "rejected") {
    await postSuspenseJE(tx, transactionId)
  }

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: { auditStatus, auditHash }
  })
  return updated
}

async function postSuspenseJE(
  tx: { id: string; stripePaymentIntentId: string; amount: number; customerEmail: string | null; organizationId: string; description: string | null },
  transactionId: string
) {
  await createSystemJournalEntry({
    organizationId: tx.organizationId,
    sourceType: "AuditorFlagged",
    sourceId: transactionId,
    reference: tx.stripePaymentIntentId,
    description: `Audit hold – ${tx.description ?? tx.stripePaymentIntentId}`,
    entryDate: new Date(),
    type: "ADJUSTING",
    lines: [
      {
        accountName: "Accounts Receivable – Disputed",
        accountType: "Assets",
        debit: tx.amount,
        credit: 0,
        description: `Audit hold – PI: ${tx.stripePaymentIntentId}`
      },
      {
        accountName: "Revenue Suspense",
        accountType: "Liabilities",
        debit: 0,
        credit: tx.amount,
        description: `Pending audit clearance – ${tx.customerEmail ?? "unknown"}`
      }
    ]
  }).catch(err => console.error("[auditor] suspense JE failed:", err))
}
