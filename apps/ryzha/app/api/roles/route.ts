import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { organizationId: session.user.organizationId },
          { isSystem: true, organizationId: null } // System roles
        ]
      }
    })

    return NextResponse.json(roles)
  } catch (error: any) {
    console.error("List roles error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, description, permissionIds } = await req.json()

    const role = await prisma.role.create({
      data: {
        name,
        description,
        organizationId: session.user.organizationId,
        permissions: {
          create: permissionIds.map((pid: string) => ({
            permissionId: pid
          }))
        }
      }
    })

    return NextResponse.json(role)
  } catch (error: any) {
    console.error("Create role error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
