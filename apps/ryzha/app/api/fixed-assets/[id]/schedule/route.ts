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
    select: { id: true },
  })
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const schedule = await prisma.depreciationSchedule.findMany({
    where: { assetId: params.id },
    orderBy: { period: "asc" },
  })

  return NextResponse.json(schedule)
}
