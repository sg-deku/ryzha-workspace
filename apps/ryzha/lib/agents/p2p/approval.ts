import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"

export interface ApprovalAgentResult {
  suggestedApprovers: string[]
  primaryApprover: string
  reasoning: string
  approvalThreshold: number | null
}

export async function runApprovalAgent(
  poId: string,
  organizationId: string
): Promise<ApprovalAgentResult> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { vendor: true, lineItems: true, organization: true },
  })

  if (!po) throw new Error("Purchase Order not found")

  const fallback: ApprovalAgentResult = {
    suggestedApprovers: ["Finance Manager"],
    primaryApprover: "Finance Manager",
    reasoning: "Default routing — AI agent unavailable.",
    approvalThreshold: null,
  }

  try {
    const response = await callLLM(
      organizationId,
      [
        {
          role: "system",
          content: `You are an AI Approval Routing Agent. Analyze purchase orders and determine the correct approver hierarchy based on the amount, vendor, and line item categories.
Consider these tiers:
- < $2,000: Finance Manager
- $2,000–$10,000: VP Finance or Controller
- $10,000–$50,000: CFO
- > $50,000: CFO + Board approval required
Respond ONLY with valid JSON: { "approvers": ["Primary Role", "Secondary Role"], "threshold": <number>, "reasoning": "<one sentence>" }`,
        },
        {
          role: "user",
          content: `PO: ${po.poNumber} | Vendor: ${po.vendor.name} | Total: $${po.totalAmount} | Line items: ${JSON.stringify(po.lineItems.map((l) => ({ description: l.description, amount: l.amount })))}`,
        },
      ],
      "agent_p2p_approval",
      { temperature: 0 }
    )

    const parsed = parseAIJson(response.content as string)
    const approvers: string[] = parsed.approvers?.length ? parsed.approvers : ["Finance Manager"]

    return {
      suggestedApprovers: approvers,
      primaryApprover: approvers[0],
      reasoning: parsed.reasoning ?? "AI-determined routing.",
      approvalThreshold: parsed.threshold ?? null,
    }
  } catch (e) {
    console.error("Approval Agent failed — falling back to default routing:", e)
    return fallback
  }
}

export async function runExpenseApprovalAgent(
  expenseId: string,
  organizationId: string
): Promise<ApprovalAgentResult> {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } })
  if (!expense) throw new Error("Expense not found")

  const fallback: ApprovalAgentResult = {
    suggestedApprovers: ["Finance Manager"],
    primaryApprover: "Finance Manager",
    reasoning: "Default routing — AI agent unavailable.",
    approvalThreshold: null,
  }

  try {
    const response = await callLLM(
      organizationId,
      [
        {
          role: "system",
          content: `You are an AI Expense Approval Routing Agent. Determine the correct approver based on the expense amount and category.
Tiers:
- < $500: Finance Manager
- $500–$2,000: Controller
- $2,000–$10,000: VP Finance
- > $10,000: CFO
Flag any unusual categories (entertainment, travel, subscriptions > $1,000) for extra scrutiny.
Respond ONLY with valid JSON: { "approvers": ["Primary Role"], "threshold": <number>, "reasoning": "<one sentence>" }`,
        },
        {
          role: "user",
          content: `Expense: $${expense.amount} | Category: ${expense.category ?? "Uncategorized"} | Description: ${expense.description}`,
        },
      ],
      "agent_p2p_approval",
      { temperature: 0 }
    )

    const parsed = parseAIJson(response.content as string)
    const approvers: string[] = parsed.approvers?.length ? parsed.approvers : ["Finance Manager"]

    return {
      suggestedApprovers: approvers,
      primaryApprover: approvers[0],
      reasoning: parsed.reasoning ?? "AI-determined routing.",
      approvalThreshold: parsed.threshold ?? null,
    }
  } catch (e) {
    console.error("Expense Approval Agent failed — falling back:", e)
    return fallback
  }
}
