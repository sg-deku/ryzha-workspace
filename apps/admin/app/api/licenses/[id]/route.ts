import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  const plan = await prisma.subscriptionPlan.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(plan)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const inUse = await prisma.license.count({ where: { planId: id } })
  if (inUse > 0) {
    return NextResponse.json(
      { error: "Plan is in use by active licenses and cannot be deleted." },
      { status: 409 }
    )
  }

  await prisma.subscriptionPlan.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
