import { prisma } from "@/lib/prisma"
import { startAgentWorkflow } from "@/lib/agents/orchestrator"

export async function runCashApplicationAgent(paymentId: string, organizationId: string) {
  // Epic 4.2: Connect O2C to Existing Agents
  // After cash application, create a Transaction and trigger the R2R workflow.
  
  const amount = 1200.00
  const customerName = "Startup Client"

  try {
    // Create Transaction record (similar to Stripe webhook)
    const transaction = await prisma.transaction.create({
      data: {
        amount,
        stripePaymentIntentId: `cash-app-${paymentId}-${Date.now()}`,
        description: `Cash Application for Payment: ${paymentId} from ${customerName}`,
        organizationId,
        agentLogs: []
      }
    })

    // Trigger the existing R2R -> O&M -> Auditor -> FP&A workflow
    // We pass the transaction ID to the orchestrator
    await startAgentWorkflow(transaction.id)

    return {
      agent: "Cash Application Agent",
      status: "COMPLETED",
      transactionId: transaction.id,
      message: `Cash of $${amount} applied. Transaction recorded and financial workflow triggered.`
    }
  } catch (error) {
    console.error("Failed in Cash Application:", error)
    return {
      agent: "Cash Application Agent",
      status: "ERROR",
      message: "Failed to process cash application."
    }
  }
}
