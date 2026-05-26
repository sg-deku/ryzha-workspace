import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"

export const dynamic = "force-dynamic"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orgId = session.user.organizationId

  const unmatched = await prisma.bankTransaction.findMany({
    where: { organizationId: orgId, matchStatus: "unmatched" },
  })

  const openInvoices = await prisma.invoice.findMany({
    where: { organizationId: orgId, status: { in: ["SENT", "PARTIAL"] } },
    select: { id: true, invoiceNumber: true, clientName: true, total: true }
  })

  if (unmatched.length === 0 || openInvoices.length === 0) {
    return NextResponse.json({ matches: [] })
  }

  const prompt = `
    Match these bank transactions to open invoices.
    Transactions: ${JSON.stringify(unmatched)}
    Invoices: ${JSON.stringify(openInvoices)}
    Return ONLY a JSON object with a "matches" array:
    {
      "matches": [
        { "transactionId": "string", "invoiceId": "string", "confidence": 0.95, "customer": "string" }
      ]
    }
  `

  const aiRes = await callLLM(orgId, [{ role: "user", content: prompt }], "agent_o2c", { modelName: "gpt-4o-mini" })
  let matches = []
  try {
    const data = parseAIJson(aiRes.content as string)
    matches = data.matches || []
  } catch (e) {
    console.error("AI matching failed", e)
  }

  return NextResponse.json({ matches })
}
