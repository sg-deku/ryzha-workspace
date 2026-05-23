import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  const tenants = await prisma.organization.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      users: { include: { user: true, role: true } },
      license: { include: { plan: true } },
      usageMetrics: {
        where: {
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const result = tenants.map((org) => {
    const totalApiCalls = org.usageMetrics.reduce((sum, m) => sum + m.apiCalls, 0)
    const totalAiTokens = org.usageMetrics.reduce((sum, m) => sum + m.aiTokensUsed, 0)
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status,
      plan: org.plan,
      userCount: org.users.length,
      license: org.license,
      totalApiCalls,
      totalAiTokens,
      createdAt: org.createdAt,
      approvedAt: org.approvedAt,
    }
  })

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, slug } = body

  const org = await prisma.organization.create({
    data: { name, slug, status: "ACTIVE" },
  })

  return NextResponse.json(org, { status: 201 })
}
