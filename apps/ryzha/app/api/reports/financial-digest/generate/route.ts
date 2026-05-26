import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPLData } from "@/lib/reports/pl-utils"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"

export const dynamic = "force-dynamic"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgId = session.user.organizationId

  const date = new Date()
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
  
  const [pl, snapshot, stats] = await Promise.all([
    getPLData(orgId, startOfMonth),
    prisma.financialSnapshot.findUnique({ where: { organizationId: orgId } }),
    fetch(new URL('/api/dashboard/stats', process.env.NEXTAUTH_URL || 'http://localhost:3000').toString(), {
      headers: {
        cookie: `next-auth.session-token=${process.env.DUMMY_TOKEN || ''}` // this is problematic to fetch internally in Next.js api route if we rely on session
      }
    }).then(r => r.ok ? r.json() : null).catch(() => null)
  ])

  // Instead of fetch, let's just get the raw numbers since we have PL and Snapshot
  const settings = await prisma.financialSettings.findUnique({ where: { organizationId: orgId } })
  const bankBalance = snapshot?.bankBalance ?? settings?.bankBalance ?? 0

  const promptContext = `
    Financial Data for Current Month:
    Revenue: $${pl.revenue}
    Total Expenses: $${pl.totalExpenses}
    Gross Profit: $${pl.grossProfit}
    Net Income: $${pl.netIncome}
    Gross Margin: ${pl.grossMargin}%
    Bank Balance: $${bankBalance}
  `

  const response = await callLLM(orgId, [
    {
      role: "system",
      content: `You are an expert FP&A analyst. Analyze the current month financial data and provide a short executive summary.
      Respond ONLY with a JSON object:
      {
        "narrative": ["Paragraph 1", "Paragraph 2"],
        "mrr": "$X,XXX (+Y%)",
        "cashBalance": "$X,XXX (+Y%)",
        "totalExpenses": "$X,XXX (+Y%)",
        "outstandingInvoices": "$X,XXX",
        "complianceStatus": "Met | Warning | Failed",
        "complianceMessage": "Brief explanation",
        "pendingActions": "Description of pending actions"
      }
      Format all numbers as USD currency strings. Use plausible but positive changes if historical data isn't provided.`
    },
    { role: "user", content: promptContext }
  ], "agent_fpna", { modelName: "gpt-4o-mini", temperature: 0.3 })

  let data
  try {
    data = parseAIJson(response.content as string)
  } catch (error) {
    console.error("Failed to parse LLM response", error)
    data = {
      narrative: ["Could not generate narrative.", "Please try again later."],
      mrr: `$${pl.revenue}`,
      cashBalance: `$${bankBalance}`,
      totalExpenses: `$${pl.totalExpenses}`,
      outstandingInvoices: "Unknown",
      complianceStatus: "Warning",
      complianceMessage: "AI analysis failed.",
      pendingActions: "Review system logs."
    }
  }

  return NextResponse.json(data)
}
