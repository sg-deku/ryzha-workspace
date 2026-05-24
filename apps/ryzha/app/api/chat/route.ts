export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAIClientConfig } from "@/lib/ai/client"
import { CHAT_TOOLS, executeTool } from "@/lib/ai/chat-tools"

const SYSTEM_PROMPT = `You are Ryzha AI, an intelligent financial assistant embedded in Ryzha — a startup financial management platform. You help founders and finance teams understand their financial data.

You have access to real-time financial tools. When a user asks about runway, cash flow, P&L, burn rate, expenses, revenue, outstanding invoices, or top clients — always call the appropriate tool to fetch live data before responding. Never tell the user to "check the Reports section" if you can fetch the data yourself using a tool.

When presenting financial data:
- Format currency with $ and 2 decimal places (e.g. $12,345.67)
- Present data in a clear, structured way
- Add brief insights or commentary where useful
- Keep responses concise and actionable

For general finance or accounting questions not requiring live data, answer directly from your knowledge.`

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const orgId = session.user.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") ?? "50")

  const messages = await prisma.chatMessage.findMany({
    where: { userId, organizationId: orgId, role: { in: ["user", "assistant"] } },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, role: true, content: true, createdAt: true },
  })

  return NextResponse.json({ messages })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const orgId = session.user.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  const { message } = await req.json()
  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  await prisma.chatMessage.create({
    data: { userId, organizationId: orgId, role: "user", content: message.trim() },
  })

  const recentMessages = await prisma.chatMessage.findMany({
    where: { userId, organizationId: orgId, role: { in: ["user", "assistant"] } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { role: true, content: true },
  })

  const history = recentMessages
    .reverse()
    .slice(0, -1)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

  let reply: string
  try {
    const { client, model, provider } = await getAIClientConfig(orgId)

    const messages: { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string; name?: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message.trim() },
    ]

    const supportsTools = provider === "groq" || provider === "openai"

    if (supportsTools) {
      let response = await client.chat.completions.create({
        model,
        messages,
        tools: CHAT_TOOLS,
        tool_choice: "auto",
        temperature: 0.4,
      })

      let iterationCount = 0
      while (response.choices[0]?.finish_reason === "tool_calls" && iterationCount < 5) {
        iterationCount++
        const assistantMessage = response.choices[0].message
        messages.push({
          role: "assistant",
          content: assistantMessage.content ?? "",
          ...(assistantMessage.tool_calls ? { tool_calls: assistantMessage.tool_calls } : {}),
        })

        const toolResults: typeof messages = []
        for (const toolCall of assistantMessage.tool_calls || []) {
          const toolArgs = JSON.parse(toolCall.function.arguments || "{}")
          const toolResult = await executeTool(toolCall.function.name, toolArgs, orgId)
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: toolResult,
          })
        }

        messages.push(...toolResults)

        response = await client.chat.completions.create({
          model,
          messages,
          tools: CHAT_TOOLS,
          tool_choice: "auto",
          temperature: 0.4,
        })
      }

      reply = response.choices[0]?.message?.content || "I couldn't generate a response."

      const usage = response.usage
      if (usage) {
        prisma.aIUsageLog.create({
          data: {
            organizationId: orgId,
            feature: "chat",
            model,
            provider,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          },
        }).catch(() => {})
      }
    } else {
      const plainMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...history,
        { role: "user" as const, content: message.trim() },
      ]
      const response = await client.chat.completions.create({
        model,
        messages: plainMessages,
        temperature: 0.4,
      })
      reply = response.choices[0]?.message?.content || "I couldn't generate a response."
    }
  } catch (err) {
    console.error("[chat] AI error:", err)
    reply = "I'm having trouble connecting to the AI service. Please contact your administrator to configure the AI provider."
  }

  await prisma.chatMessage.create({
    data: { userId, organizationId: orgId, role: "assistant", content: reply },
  })

  return NextResponse.json({ reply })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const orgId = session.user.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  await prisma.chatMessage.deleteMany({ where: { userId, organizationId: orgId } })

  return NextResponse.json({ success: true })
}
