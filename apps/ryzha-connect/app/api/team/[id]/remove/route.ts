import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId, id: currentUserId } = session.user
  const { id: targetUserId } = await params

  if (targetUserId === currentUserId) {
    return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 })
  }

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId } },
    include: { role: { select: { name: true } } },
  })

  if (!membership) {
    return NextResponse.json({ error: "User is not a member of this organisation" }, { status: 404 })
  }

  if (membership.role.name === "OWNER") {
    return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 403 })
  }

  await prisma.userOrganization.delete({
    where: { userId_organizationId: { userId: targetUserId, organizationId } },
  })

  return NextResponse.json({ ok: true })
}
