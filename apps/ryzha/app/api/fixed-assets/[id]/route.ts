import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const asset = await prisma.fixedAsset.findFirst({
    where: { id: params.id, organizationId: session.user.organizationId },
    include: {
      vendor: { select: { id: true, name: true } },
      depreciationSchedule: { orderBy: { period: "asc" } },
    },
  })

  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(asset)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { name, description, category, glAssetAccount, glDepreciationAccount, glAccumulatedAccount, tags } = body

    const asset = await prisma.fixedAsset.updateMany({
      where: { id: params.id, organizationId: session.user.organizationId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(glAssetAccount !== undefined && { glAssetAccount }),
        ...(glDepreciationAccount !== undefined && { glDepreciationAccount }),
        ...(glAccumulatedAccount !== undefined && { glAccumulatedAccount }),
        ...(tags !== undefined && { tags }),
      },
    })

    return NextResponse.json(asset)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
