import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { callLLM } from "@/lib/ai/llm"
import { appendAgentLog } from "./utils"

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

  // Find matching contract
  const contract = await prisma.contract.findFirst({
    where: {
      stripePaymentIntentId: tx.stripePaymentIntentId,
      organizationId: tx.organizationId
    }
  })

  let auditStatus = "failed"
  let auditHash = null
  let logMessage = ""
  let anomalyDetected = false
  let aiReasoning = ""

  // 1. Check for basic anomalies (mocking historical comparison)
  if (tx.amount > 5000) { // Example: unusually large transaction
    anomalyDetected = true
  }

  // 2. AI-powered investigative reasoning
  try {
    const response = await callLLM(tx.organizationId, [
      {
        role: "system",
        content: `You are a forensic auditor. Investigate this transaction for anomalies. 
          Consider: amount vs description, contract availability, and common fraud patterns.
          Respond with JSON: { "is_anomaly": boolean, "investigation_notes": string, "risk_score": number }`
      },
      {
        role: "user",
        content: `Transaction: ${tx.description}, Amount: ${tx.amount}, Contract Found: ${!!contract}`
      }
    ], "agent_auditor", { temperature: 0 })

    try {
      const result = JSON.parse(response.content as string)
      anomalyDetected = result.is_anomaly
      aiReasoning = result.investigation_notes
    } catch (e) {
      console.error("Auditor AI reasoning failed", e)
    }
  } catch (error) {
    console.error("Auditor AI failed", error)
  }

  if (contract && contract.status === "signed") {
    auditStatus = "verified"
    auditHash = crypto.createHash("sha256").update(`${contract.id}-${tx.amount}`).digest("hex")
    logMessage = `Auditor: Audit Hash Verified: Stripe ID matches Contract Terms. Hash: ${auditHash.substring(0, 8)}...`
    
    if (anomalyDetected) {
      logMessage += ` WARNING: ${aiReasoning || "Unusual transaction pattern detected."}`
    }
  } else {
    auditStatus = autoReject ? "rejected" : "failed"
    logMessage = `Auditor: Verification failed – no matching contract found for ${tx.description || tx.stripePaymentIntentId}.`
    if (aiReasoning) logMessage += ` Investigation: ${aiReasoning}`
  }

  await appendAgentLog(transactionId, "Auditor", logMessage)

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: { auditStatus, auditHash },
  })
  return updated
}
