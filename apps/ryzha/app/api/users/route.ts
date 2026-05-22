import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!(await hasPermission("users:manage"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const users = await prisma.userOrganization.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true
          }
        },
        role: true
      }
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error("List users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!(await hasPermission("users:manage"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { email, name, roleId } = await req.json()

    if (!email || !name || !roleId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      // Check if already in this org
      const existingMembership = await prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: session.user.organizationId
          }
        }
      })
      if (existingMembership) {
        return NextResponse.json({ error: "User already in organization" }, { status: 400 })
      }
    } else {
      // Create invited user
      user = await prisma.user.create({
        data: {
          email,
          name,
          status: "INVITED"
        }
      })
    }

    await prisma.userOrganization.create({
      data: {
        userId: user.id,
        organizationId: session.user.organizationId,
        roleId: roleId
      }
    })

    // Mock invite email
    console.log(`Invitation sent to ${email} for organization ${session.user.organizationId}`)

    return NextResponse.json({ message: "User invited successfully" })
  } catch (error: any) {
    console.error("Invite user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
