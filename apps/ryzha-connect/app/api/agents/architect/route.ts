import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { callAI } from "@/lib/ai-client"

const SYSTEM_PROMPT = `You are Ryzha's Architect Agent — an expert financial architect for hyper-growth startups. Your job is to conduct a structured intake interview to design the organisation's financial architecture.

You ask ONE question at a time. After each answer, acknowledge it briefly, then ask the next question from this sequence:

1. Business model (SaaS / marketplace / services / usage-based / hybrid)
2. How they bill customers (monthly subscriptions / annual contracts / usage / milestone / blended)
3. Which accounting standard applies (US GAAP ASC 606 / IFRS 15)
4. What tools they use for: revenue/billing, payroll, expenses/cards, banking (can ask all at once)
5. What legal entities and currencies they operate in
6. What departments/cost centres they have
7. What metrics their board tracks (ARR, NRR, burn, etc.)

Once you have all the answers, output a JSON block EXACTLY in this format (and nothing else after it):

\`\`\`json
{
  "complete": true,
  "architecture": {
    "businessModel": "saas",
    "billingModel": "annual",
    "revenueRecognition": {
      "standard": "ASC606",
      "defaultPolicy": "ratable",
      "defaultTermMonths": 12
    },
    "dataFlowMap": {
      "accountingSystem": "quickbooks",
      "billing": "stripe",
      "payroll": "gusto",
      "expenses": "ramp",
      "banking": "mercury",
      "crm": "hubspot"
    },
    "departmentStructure": {
      "departments": ["Engineering", "Sales", "Marketing", "G&A"]
    },
    "entities": [
      { "name": "Primary Entity", "currency": "USD" }
    ],
    "metricsLibrary": {
      "boardMetrics": ["ARR", "MRR", "NRR", "BurnMultiple", "Runway"]
    }
  }
}
\`\`\`

If the conversation is still in progress (not all questions answered), respond conversationally. Be concise and professional. Do not repeat questions already answered.`

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { messages } = await req.json()
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 })
  }

  try {
    const response = await callAI(
      session.user.organizationId,
      [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      { feature: "agent_architect", maxTokens: 800 }
    )

    const content = response.content

    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.complete && parsed.architecture) {
          const arch = parsed.architecture

          await prisma.financialArchitecture.upsert({
            where: { organizationId: session.user.organizationId },
            create: {
              organizationId: session.user.organizationId,
              businessModel: arch.businessModel,
              billingModel: arch.billingModel,
              revenueRecognition: arch.revenueRecognition ?? {},
              dataFlowMap: arch.dataFlowMap ?? {},
              departmentStructure: arch.departmentStructure ?? {},
              entities: arch.entities ?? [],
              metricsDefinitions: arch.metricsLibrary ?? {},
            },
            update: {
              businessModel: arch.businessModel,
              billingModel: arch.billingModel,
              revenueRecognition: arch.revenueRecognition ?? {},
              dataFlowMap: arch.dataFlowMap ?? {},
              departmentStructure: arch.departmentStructure ?? {},
              entities: arch.entities ?? [],
              metricsDefinitions: arch.metricsLibrary ?? {},
            },
          })

          return NextResponse.json({
            role: "assistant",
            content: content.replace(/```json[\s\S]*?```/, "").trim() ||
              "Your financial architecture has been designed and saved. Ryzha's agents are now configured to use these settings. You can review and adjust them in the Architecture settings.",
            architectureSaved: true,
            architecture: arch,
          })
        }
      } catch { }
    }

    return NextResponse.json({
      role: "assistant",
      content,
      architectureSaved: false,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
