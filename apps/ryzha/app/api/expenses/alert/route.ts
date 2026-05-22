import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const anomalies = await prisma.expenseAnomaly.findMany({
    where: { 
      organizationId: session.user.organizationId,
      status: "PENDING"
    },
    include: { expense: true },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(anomalies)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, status, isFalsePositive } = await req.json()

  const updated = await prisma.expenseAnomaly.update({
    where: { id },
    data: { status, isFalsePositive }
  })

  return NextResponse.json(updated)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action } = await req.json()

  if (action === "resolve_all") {
    await prisma.expenseAnomaly.updateMany({
      where: { 
        organizationId: session.user.organizationId,
        status: "PENDING"
      },
      data: { status: "REVIEWED" }
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
