import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const pending = await prisma.organization.findMany({
    where: { status: "PENDING" },
    include: {
      users: {
        include: {
          user: { select: { name: true, email: true } },
          role: true,
        },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(pending)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { organizationId, action, defaultPlanId, maxUsers, maxApiCalls, maxAiTokens, adminNotes, billingContact } = body

  if (action === "approve") {
    const defaultPlan = defaultPlanId
      ? await prisma.subscriptionPlan.findUnique({ where: { id: defaultPlanId } })
      : await prisma.subscriptionPlan.findFirst({ where: { isActive: true }, orderBy: { price: "asc" } })

    await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: organizationId },
        data: {
          status: "ACTIVE",
          approvedAt: new Date(),
          approvedBy: session.user.id,
          ...(adminNotes !== undefined && { adminNotes }),
        },
      })

      if (defaultPlan) {
        await tx.license.upsert({
          where: { organizationId },
          create: {
            organizationId,
            planId: defaultPlan.id,
            maxUsers: maxUsers ?? (defaultPlan.features as any)?.maxUsers ?? 5,
            maxApiCalls: maxApiCalls ?? (defaultPlan.features as any)?.maxApiCalls ?? 10000,
            maxAiTokens: maxAiTokens ?? (defaultPlan.features as any)?.aiTokens ?? 50000,
            ...(billingContact !== undefined && { billingContact }),
          },
          update: {
            planId: defaultPlan.id,
            maxUsers: maxUsers ?? (defaultPlan.features as any)?.maxUsers ?? 5,
            maxApiCalls: maxApiCalls ?? (defaultPlan.features as any)?.maxApiCalls ?? 10000,
            maxAiTokens: maxAiTokens ?? (defaultPlan.features as any)?.aiTokens ?? 50000,
            ...(billingContact !== undefined && { billingContact }),
          },
        })
      }
    })

    return NextResponse.json({ success: true, action: "approved" })
  }

  if (action === "reject") {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { status: "REJECTED" },
    })

    return NextResponse.json({ success: true, action: "rejected" })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
