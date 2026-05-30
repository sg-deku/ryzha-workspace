import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"

export interface ReconciliationMatch {
  bankTransactionId: string
  matchType: "vendor_payment" | "invoice_payment" | "unmatched"
  matchedId: string | null
  confidence: number
  reasoning: string
  amountVariance: number
  suggestedAction: "auto_confirm" | "review" | "ignore"
}

function scoreMatch(
  bankAmount: number,
  targetAmount: number,
  bankDate: Date,
  targetDate: Date,
  bankDesc: string,
  targetLabel: string
): number {
  let score = 0

  const amountDiff = Math.abs(bankAmount - targetAmount)
  const amountPct = amountDiff / Math.abs(targetAmount || 1)
  if (amountDiff < 0.01) score += 40
  else if (amountPct < 0.02) score += 25
  else if (amountPct < 0.05) score += 10

  const dateDiff = Math.abs(bankDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
  if (dateDiff <= 1) score += 20
  else if (dateDiff <= 3) score += 15
  else if (dateDiff <= 7) score += 8
  else if (dateDiff <= 14) score += 3

  const descLower = bankDesc.toLowerCase()
  const labelLower = targetLabel.toLowerCase()
  const labelWords = labelLower.split(/\s+/).filter(w => w.length > 3)
  const matchedWords = labelWords.filter(w => descLower.includes(w))
  if (matchedWords.length > 0) score += Math.min(matchedWords.length * 8, 25)

  return Math.min(score, 92)
}

export async function runAIReconciliationAgent(organizationId: string): Promise<ReconciliationMatch[]> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 45)

  const [unmatchedBankTxns, openVendorPayments, openPayments] = await Promise.all([
    prisma.bankTransaction.findMany({
      where: { organizationId, matchStatus: "unmatched" },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.vendorPayment.findMany({
      where: {
        organizationId,
        paymentDate: { gte: thirtyDaysAgo },
        transaction: { is: null },
      },
      include: {
        vendorInvoice: { select: { invoiceNumber: true } },
        transaction: { select: { id: true } },
      },
      take: 100,
    }),
    prisma.payment.findMany({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo },
        bankTransactionId: null,
      },
      include: {
        invoice: { select: { invoiceNumber: true, clientName: true } },
      },
      take: 50,
    }),
  ])

  if (unmatchedBankTxns.length === 0) return []

  const results: ReconciliationMatch[] = []

  for (const btx of unmatchedBankTxns) {
    const isDebit = btx.amount < 0

    if (isDebit) {
      let bestScore = 0
      let bestVP: typeof openVendorPayments[0] | null = null

      for (const vp of openVendorPayments) {
        const label = `${vp.vendorInvoice.invoiceNumber} ${vp.method}`
        const s = scoreMatch(Math.abs(btx.amount), vp.amount, btx.date, vp.paymentDate, btx.description, label)
        if (s > bestScore) { bestScore = s; bestVP = vp }
      }

      if (bestScore >= 30 && bestVP) {
        let finalScore = bestScore
        let reasoning = `Rule-based score ${bestScore}/92. `

        if (bestScore < 70) {
          try {
            const aiRes = await callLLM(organizationId, [
              {
                role: "system",
                content: `You are a bank reconciliation specialist. Assess whether this bank debit matches this vendor payment.
Respond with JSON: { "confidence_adjustment": number, "reasoning": string }
confidence_adjustment: -20 to +30 (adjustment to current score of ${bestScore})
reasoning: one sentence explanation.`,
              },
              {
                role: "user",
                content: `Bank debit: "${btx.description}" date ${btx.date.toISOString().slice(0,10)} amount $${Math.abs(btx.amount)}${btx.reference ? ` ref: ${btx.reference}` : ""}
Vendor payment: Invoice ${bestVP.vendorInvoice.invoiceNumber} amount $${bestVP.amount} date ${bestVP.paymentDate.toISOString().slice(0,10)} method: ${bestVP.method}`,
              },
            ], "agent_bank_recon", { temperature: 0 })
            const parsed = parseAIJson(aiRes.content as string)
            finalScore = Math.max(0, Math.min(100, bestScore + (parsed.confidence_adjustment ?? 0)))
            reasoning += parsed.reasoning ?? ""
          } catch {}
        } else {
          reasoning += `Amount and date alignment strong.`
        }

        const amountVariance = Math.abs(btx.amount) - bestVP.amount
        results.push({
          bankTransactionId: btx.id,
          matchType: "vendor_payment",
          matchedId: bestVP.id,
          confidence: finalScore / 100,
          reasoning,
          amountVariance,
          suggestedAction: finalScore >= 92 ? "auto_confirm" : finalScore >= 60 ? "review" : "ignore",
        })
        continue
      }
    } else {
      let bestScore = 0
      let bestPay: typeof openPayments[0] | null = null

      for (const pay of openPayments) {
        const label = `${pay.invoice.clientName} ${pay.invoice.invoiceNumber}`
        const s = scoreMatch(btx.amount, pay.amount, btx.date, new Date(pay.createdAt), btx.description, label)
        if (s > bestScore) { bestScore = s; bestPay = pay }
      }

      if (bestScore >= 30 && bestPay) {
        let finalScore = bestScore
        let reasoning = `Rule-based score ${bestScore}/92.`

        const amountVariance = btx.amount - bestPay.amount
        results.push({
          bankTransactionId: btx.id,
          matchType: "invoice_payment",
          matchedId: bestPay.id,
          confidence: finalScore / 100,
          reasoning,
          amountVariance,
          suggestedAction: finalScore >= 92 ? "auto_confirm" : finalScore >= 60 ? "review" : "ignore",
        })
        continue
      }
    }

    results.push({
      bankTransactionId: btx.id,
      matchType: "unmatched",
      matchedId: null,
      confidence: 0,
      reasoning: "No matching vendor payment or invoice payment found within tolerance.",
      amountVariance: 0,
      suggestedAction: "ignore",
    })
  }

  return results.filter(r => r.matchType !== "unmatched")
}
