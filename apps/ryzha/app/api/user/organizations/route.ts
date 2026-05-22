import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const memberships = await prisma.userOrganization.findMany({
      where: { userId: session.user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        }
      }
    })

    return NextResponse.json(memberships.map(m => m.organization))
  } catch (error: any) {
    console.error("List organizations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
