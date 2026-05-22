import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const org = await prisma.organization.findUnique({
    where: { id: params.id },
    include: {
      users: {
        include: {
          user: { select: { id: true, name: true, email: true, status: true, createdAt: true } },
          role: true,
        },
      },
      license: { include: { plan: true } },
      usageMetrics: {
        orderBy: { date: "desc" },
        take: 90,
      },
    },
  })

  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(org)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { status, name } = body

  const org = await prisma.organization.update({
    where: { id: params.id },
    data: {
      ...(status !== undefined && { status }),
      ...(name !== undefined && { name }),
      ...(status === "ACTIVE" && {
        approvedAt: new Date(),
        approvedBy: session.user.id,
      }),
    },
  })

  return NextResponse.json(org)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.organization.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
