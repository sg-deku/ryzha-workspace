import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const body = await req.json().catch(() => ({}))
  const { email, role: roleName } = body as { email?: string; role?: string }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const normalizedRole = (roleName ?? "MEMBER").toUpperCase()

  const targetRole = await prisma.role.findFirst({
    where: {
      OR: [
        { organizationId, name: normalizedRole },
        { isSystem: true, name: normalizedRole },
      ],
    },
    select: { id: true, name: true },
  })

  if (!targetRole) {
    return NextResponse.json({ error: `Role ${normalizedRole} not found for this organisation` }, { status: 404 })
  }

  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedEmail.split("@")[0],
        status: "PENDING_VERIFICATION" as any,
      },
      select: { id: true, name: true, email: true },
    })
  }

  const existing = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
  })

  if (existing) {
    if (existing.roleId !== targetRole.id) {
      await prisma.userOrganization.update({
        where: { userId_organizationId: { userId: user.id, organizationId } },
        data: { roleId: targetRole.id },
      })
      return NextResponse.json({ ok: true, updated: true, userId: user.id, message: `Role updated to ${normalizedRole}` })
    }
    return NextResponse.json({ ok: true, alreadyMember: true, userId: user.id })
  }

  await prisma.userOrganization.create({
    data: {
      userId: user.id,
      organizationId,
      roleId: targetRole.id,
    },
  })

  return NextResponse.json({
    ok: true,
    invited: true,
    userId: user.id,
    email: user.email,
    role: targetRole.name,
  })
}
