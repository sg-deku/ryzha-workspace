import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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
    // Redis removed for simplified architecture
    
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
