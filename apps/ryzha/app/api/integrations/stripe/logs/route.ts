import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { 
        organizationId: session.user.organizationId
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Failed to fetch stripe logs:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
