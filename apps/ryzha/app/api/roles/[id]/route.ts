import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!(await hasPermission("roles:manage"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, description, permissionIds } = await req.json()

    const role = await prisma.role.findUnique({ where: { id } })
    if (!role || (role.isSystem && role.organizationId === null)) {
      return NextResponse.json({ error: "Cannot edit system roles" }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.role.update({
        where: { id },
        data: {
          name,
          description,
          permissions: {
            create: permissionIds.map((pid: string) => ({
              permissionId: pid
            }))
          }
        }
      })
    ])

    return NextResponse.json({ message: "Role updated successfully" })
  } catch (error: any) {
    console.error("Update role error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!(await hasPermission("roles:manage"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const role = await prisma.role.findUnique({ where: { id } })
    if (!role || role.isSystem) {
      return NextResponse.json({ error: "Cannot delete system roles" }, { status: 400 })
    }

    const userCount = await prisma.userOrganization.count({
      where: { roleId: id }
    })

    if (userCount > 0) {
      return NextResponse.json({ error: "Cannot delete role with assigned users" }, { status: 400 })
    }

    await prisma.role.delete({ where: { id } })

    return NextResponse.json({ message: "Role deleted successfully" })
  } catch (error: any) {
    console.error("Delete role error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
