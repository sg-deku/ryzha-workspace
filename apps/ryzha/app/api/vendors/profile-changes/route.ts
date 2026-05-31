import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || "PENDING"

  const changes = await prisma.vendorProfileChange.findMany({
    where: { organizationId: session.user.organizationId, status },
    include: { vendor: { select: { id: true, name: true } } },
    orderBy: { requestedAt: "desc" },
  })

  return NextResponse.json(changes)
}
