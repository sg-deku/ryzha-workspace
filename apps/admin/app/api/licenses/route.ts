import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const plans = await prisma.subscriptionPlan.findMany({
    include: { _count: { select: { licenses: true } } },
    orderBy: { price: "asc" },
  })

  return NextResponse.json(plans)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, price, interval, features, stripePriceId } = body

  const plan = await prisma.subscriptionPlan.create({
    data: { name, description, price, interval, features, stripePriceId },
  })

  return NextResponse.json(plan, { status: 201 })
}
