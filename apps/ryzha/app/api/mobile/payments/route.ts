import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 20

  const transactions = await prisma.transaction.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
    select: {
      id: true,
      stripePaymentIntentId: true,
      amount: true,
      currency: true,
      description: true,
      customerEmail: true,
      auditStatus: true,
      workflowStatus: true,
      createdAt: true,
    },
  })

  return NextResponse.json(transactions)
}
