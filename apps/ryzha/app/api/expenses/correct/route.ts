import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { expenseId, category, taxRelevant } = await req.json()
    
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, organizationId: session.user.organizationId }
    })

    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Update DB
    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: { category, taxRelevant, status: "CATEGORIZED" }
    })

    // Store correction in Redis for few-shot learning (Organization-specific)
    const correctionKey = `corrections:org:${session.user.organizationId}`
    const correctionData = {
      description: expense.description,
      category,
      taxRelevant
    }

    // Keep only last 10 corrections for few-shot prompt
    await redis.lpush(correctionKey, JSON.stringify(correctionData))
    await redis.ltrim(correctionKey, 0, 9)

    // Also update the global cache for this vendor/description
    const cacheKey = `expense:category:${(expense.description).toLowerCase().replace(/\s+/g, "_")}`
    await redis.set(cacheKey, JSON.stringify({ category, taxRelevant }), "EX", 60 * 60 * 24 * 30)

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
