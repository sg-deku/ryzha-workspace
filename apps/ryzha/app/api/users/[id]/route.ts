import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!(await hasPermission("users:manage"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { roleId, status } = await req.json()

    await prisma.userOrganization.update({
      where: {
        userId_organizationId: {
          userId: params.id,
          organizationId: session.user.organizationId
        }
      },
      data: {
        roleId: roleId
      }
    })

    if (status) {
      await prisma.user.update({
        where: { id: params.id },
        data: { status }
      })
    }

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error: any) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!(await hasPermission("users:manage"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prevent deleting self
    if (params.id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
    }

    // Check if last admin
    const adminRole = await prisma.role.findFirst({
      where: { 
        organizationId: session.user.organizationId,
        name: "Admin"
      }
    })

    if (adminRole) {
      const adminCount = await prisma.userOrganization.count({
        where: {
          organizationId: session.user.organizationId,
          roleId: adminRole.id
        }
      })

      const targetUser = await prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId: params.id,
            organizationId: session.user.organizationId
          }
        }
      })

      if (adminCount <= 1 && targetUser?.roleId === adminRole.id) {
        return NextResponse.json({ error: "Cannot delete the last admin" }, { status: 400 })
      }
    }

    await prisma.userOrganization.delete({
      where: {
        userId_organizationId: {
          userId: params.id,
          organizationId: session.user.organizationId
        }
      }
    })

    return NextResponse.json({ message: "User removed from organization" })
  } catch (error: any) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
