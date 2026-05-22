import { prisma } from "@/lib/prisma"

export async function appendAgentLog(
  transactionId: string,
  agent: string,
  message: string,
  extra?: Record<string, any>
): Promise<void> {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { agentLogs: true },
  })

  const existing = Array.isArray(tx?.agentLogs) ? (tx.agentLogs as any[]) : []

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      agentLogs: [
        ...existing,
        { agent, message, timestamp: new Date().toISOString(), ...extra },
      ],
    },
  })
}
