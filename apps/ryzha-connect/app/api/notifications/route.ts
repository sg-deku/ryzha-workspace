import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get("unread") === "true"

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        link: true,
        read: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { organizationId: session.user.organizationId, read: false },
    }),
  ])

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { id, markAllRead } = body

  if (markAllRead) {
    await prisma.notification.updateMany({
      where: { organizationId: session.user.organizationId, read: false },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  }

  if (id) {
    const existing = await prisma.notification.findFirst({
      where: { id, organizationId: session.user.organizationId },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Provide id or markAllRead" }, { status: 400 })
}

export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const clearAll = searchParams.get("clearAll") === "true"

  if (clearAll) {
    await prisma.notification.deleteMany({
      where: { organizationId: session.user.organizationId, read: true },
    })
    return NextResponse.json({ ok: true })
  }

  if (id) {
    const existing = await prisma.notification.findFirst({
      where: { id, organizationId: session.user.organizationId },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.notification.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Provide id or clearAll=true" }, { status: 400 })
}
