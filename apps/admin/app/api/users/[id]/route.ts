import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { organizations: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.isSuperAdmin) {
      return NextResponse.json({ error: "Cannot delete a super admin" }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      // Delete user's chat messages
      await tx.chatMessage.deleteMany({ where: { userId: id } })
      
      // Delete user organization links
      await tx.userOrganization.deleteMany({ where: { userId: id } })
      
      // Delete the user
      await tx.user.delete({ where: { id } })

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: "DELETE_USER",
          entityType: "USER",
          entityId: id,
          actorId: session.user.id,
          details: { email: user.email, name: user.name }
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
