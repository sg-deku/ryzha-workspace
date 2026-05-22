import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { planId, maxUsers, maxApiCalls, maxAiTokens, endsAt, status } = body

  const license = await prisma.license.upsert({
    where: { organizationId: id },
    create: {
      organizationId: id,
      planId,
      maxUsers: maxUsers ?? 5,
      maxApiCalls: maxApiCalls ?? 10000,
      maxAiTokens: maxAiTokens ?? 50000,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      status: status ?? "ACTIVE",
    },
    update: {
      ...(planId && { planId }),
      ...(maxUsers !== undefined && { maxUsers }),
      ...(maxApiCalls !== undefined && { maxApiCalls }),
      ...(maxAiTokens !== undefined && { maxAiTokens }),
      ...(endsAt !== undefined && { endsAt: endsAt ? new Date(endsAt) : null }),
      ...(status && { status }),
    },
    include: { plan: true },
  })

  return NextResponse.json(license)
}
