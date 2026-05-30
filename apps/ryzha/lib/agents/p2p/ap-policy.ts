import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"

export interface APPolicyResult {
  status: "PASS" | "WARN"
  daysUntilDue: number
  earlyDiscountEligible: boolean
  paymentTermsOk: boolean
  suggestedCategory: string
  aiNotes: string
  message: string
}

export async function runAPPolicyAgent(
  vendorPaymentId: string,
  organizationId: string
): Promise<APPolicyResult> {
  const payment = await prisma.vendorPayment.findUnique({
    where: { id: vendorPaymentId },
    include: {
      vendorInvoice: {
        include: { vendor: { select: { name: true, paymentTerms: true } } },
      },
    },
  })

  if (!payment) {
    return {
      status: "PASS",
      daysUntilDue: 0,
      earlyDiscountEligible: false,
      paymentTermsOk: true,
      suggestedCategory: "Accounts Payable",
      aiNotes: "",
      message: "Payment not found — AP policy check skipped.",
    }
  }

  const invoice = payment.vendorInvoice
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null
  const daysUntilDue = dueDate
    ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  const earlyDiscountEligible = daysUntilDue > 10
  const paymentTermsOk = daysUntilDue >= -5

  let suggestedCategory = "Accounts Payable"
  let aiNotes = ""

  try {
    const response = await callLLM(
      organizationId,
      [
        {
          role: "system",
          content: `You are an AP specialist. Classify this vendor payment and evaluate payment terms compliance.
Respond with JSON: { "category": string, "notes": string }
Category must be one of: Software & SaaS, Cloud Infrastructure, Professional Services, Marketing & Advertising, Office & Facilities, Equipment & Hardware, Utilities, Insurance, Legal & Compliance, Other Operating Expense.`,
        },
        {
          role: "user",
          content: `Vendor: ${invoice.vendor.name}
Invoice: ${invoice.invoiceNumber}
Amount: $${payment.amount}
Payment method: ${payment.method}
Days until due: ${daysUntilDue}
Payment terms: ${(invoice.vendor as any).paymentTerms ?? "Net-30"}`,
        },
      ],
      "agent_ap_policy",
      { temperature: 0 }
    )
    const parsed = parseAIJson(response.content as string)
    suggestedCategory = parsed.category || suggestedCategory
    aiNotes = parsed.notes || ""
  } catch (e) {
    console.error("[APPolicy] AI classification failed, using defaults", e)
  }

  const termsNote = daysUntilDue > 0
    ? `Payment is ${daysUntilDue} day(s) before due date.${earlyDiscountEligible ? " Early payment — check for 2/10 Net-30 discount eligibility." : ""}`
    : daysUntilDue === 0
    ? "Payment is due today."
    : `Payment is ${Math.abs(daysUntilDue)} day(s) overdue.`

  return {
    status: paymentTermsOk ? "PASS" : "WARN",
    daysUntilDue,
    earlyDiscountEligible,
    paymentTermsOk,
    suggestedCategory,
    aiNotes,
    message: `AP Policy: ${termsNote} Category: ${suggestedCategory}.${aiNotes ? ` Notes: ${aiNotes}` : ""}`,
  }
}
