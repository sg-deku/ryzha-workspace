import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const periods = await prisma.accountingPeriod.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: [{ fiscalYear: "desc" }, { startDate: "desc" }],
  })

  return NextResponse.json(periods)
}
