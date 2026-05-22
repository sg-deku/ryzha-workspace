import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const logs = await prisma.webhookLog.findMany({
    where: { 
      webhook: { organizationId: session.user.organizationId } 
    },
    include: { webhook: { select: { url: true } } },
    orderBy: { createdAt: "desc" },
    take: 50
  })

  return NextResponse.json(logs)
}
