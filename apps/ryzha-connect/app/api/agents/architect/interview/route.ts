import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { callAI } from "@/lib/ai-client"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const { messages } = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[]
  }

  const SYSTEM_PROMPT = `You are Ryzha's AI Financial Architect. Your job is to conduct a structured onboarding interview to understand a startup's financial setup, then produce a complete architecture configuration.

Interview the user conversationally — ask one or two focused questions at a time. Cover these topics in order:
1. Business model (SaaS, marketplace, services, usage-based, hybrid)
2. How they bill customers (annual contracts, monthly subscriptions, usage-based, milestone, blended)
3. Accounting standard (US GAAP ASC 606 or IFRS 15)
4. Accounting system (QuickBooks, Xero, NetSuite, Sage)
5. Primary revenue source (Stripe, Chargebee, Paddle, manual)
6. Payroll system (Gusto, Rippling, Deel, ADP, manual)
7. Expense/card system (Ramp, Brex, Divvy, Expensify, manual)
8. Departments / cost centres (offer defaults: Engineering, Sales, Marketing, G&A, Customer Success)
9. Legal entities and currencies (if multi-entity)

Be concise, friendly, and professional. After you have collected enough information (all 9 topics), output ONLY the following JSON block (nothing else, no explanation, no markdown wrapper):

ARCHITECT_CONFIG_START
{
  "businessModel": "saas|marketplace|services|usage_based|hybrid",
  "billingModel": "annual|monthly|usage|milestone|blended",
  "accountingStandard": "ASC606|IFRS15",
  "revenueRecognitionPolicy": "ratable|point_in_time|milestone",
  "defaultTermMonths": 12,
  "accountingSystem": "quickbooks|xero|netsuite|sage",
  "revenueSource": "stripe|chargebee|paddle|manual",
  "payrollSource": "gusto|rippling|deel|adp|manual",
  "expenseSource": "ramp|brex|divvy|expensify|manual",
  "departments": ["Engineering", "Sales", "Marketing", "G&A"],
  "entities": [{ "name": "Primary Entity", "currency": "USD" }]
}
ARCHITECT_CONFIG_END

If you do not yet have enough information, ask the next most important question instead. Never output the JSON block until you have covered all 9 topics.`

  try {
    const response = await callAI(organizationId, [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ], {
      feature: "architect_interview",
      maxTokens: 600,
    })

    const content = response.content

    const configMatch = content.match(/ARCHITECT_CONFIG_START\s*([\s\S]*?)\s*ARCHITECT_CONFIG_END/)
    if (configMatch) {
      try {
        const formData = JSON.parse(configMatch[1])
        return NextResponse.json({ done: true, formData })
      } catch {
        return NextResponse.json({ done: false, message: content.replace(/ARCHITECT_CONFIG_START[\s\S]*ARCHITECT_CONFIG_END/g, "").trim() })
      }
    }

    return NextResponse.json({ done: false, message: content })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
