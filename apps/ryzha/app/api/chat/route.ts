export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { invokeAI } from "@/lib/ai/client"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const orgId = session.user.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") ?? "50")

  const messages = await prisma.chatMessage.findMany({
    where: { userId, organizationId: orgId },
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
    where: { userId, organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { role: true, content: true },
  })
  const historyContext = recentMessages
    .reverse()
    .slice(0, -1)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n")

  const systemPrompt = `You are Ryzha AI, a helpful financial assistant for a startup financial management platform called Ryzha. You help founders and finance teams understand their financial data, answer questions about invoices, expenses, vendors, runway, cash flow, and general accounting concepts.

Be concise, professional, and actionable. If a user asks about specific report data (like runway, expenses, revenue), suggest they use the Reports section for live data. For general finance questions, provide helpful answers.

${historyContext ? `Recent conversation:\n${historyContext}\n\n` : ""}User: ${message.trim()}`

  let reply: string
  try {
    reply = await invokeAI(orgId, systemPrompt, { temperature: 0.4, feature: "chat" })
  } catch (err) {
    console.error("[chat] AI error:", err)
    reply = "I'm having trouble connecting to the AI service. Please check your AI configuration in Settings → Financial Engine."
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
