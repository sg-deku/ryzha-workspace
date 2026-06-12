import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get("unread") === "true"

  const notifications = await (prisma.notification as any).findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  const unreadCount = await (prisma.notification as any).count({
    where: { organizationId: session.user.organizationId, read: false },
  })

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { id, markAllRead } = body

  if (markAllRead) {
    await (prisma.notification as any).updateMany({
      where: { organizationId: session.user.organizationId, read: false },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  }

  if (id) {
    await (prisma.notification as any).update({
      where: { id },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Provide id or markAllRead" }, { status: 400 })
}
