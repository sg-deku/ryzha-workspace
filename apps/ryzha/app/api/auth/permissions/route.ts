import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ permissions: [] })

    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: session.user.organizationId
        }
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    if (!userOrg) return NextResponse.json({ permissions: [] })

    const permissions = userOrg.role.permissions.map(rp => rp.permission.name)

    return NextResponse.json({ permissions })
  } catch (error: any) {
    console.error("Auth permissions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
