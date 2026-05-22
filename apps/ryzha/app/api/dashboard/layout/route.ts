import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DEFAULT_WIDGET_CONFIG } from "@/lib/dashboard/widget-config"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const orgId = session.user.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  const layout = await prisma.dashboardLayout.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  })

  if (!layout) {
    return NextResponse.json({ widgets: DEFAULT_WIDGET_CONFIG })
  }

  const saved = layout.widgets as any[]
  const savedIds = new Set(saved.map((w: any) => w.id))
  const maxOrder = saved.reduce((m: number, w: any) => Math.max(m, w.order ?? 0), 0)
  let nextOrder = maxOrder + 1
  const merged = [
    ...saved,
    ...DEFAULT_WIDGET_CONFIG.filter((w) => !savedIds.has(w.id)).map((w) => ({
      ...w,
      order: nextOrder++,
    })),
  ]

  return NextResponse.json({ widgets: merged })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const orgId = session.user.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  const { widgets } = await req.json()
  if (!Array.isArray(widgets)) {
    return NextResponse.json({ error: "Invalid widgets format" }, { status: 400 })
  }

  const validIds = DEFAULT_WIDGET_CONFIG.map((w: any) => w.id)
  for (const w of widgets) {
    if (!validIds.includes(w.id)) {
      return NextResponse.json({ error: `Unknown widget id: ${w.id}` }, { status: 400 })
    }
  }

  const saved = await prisma.dashboardLayout.upsert({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    update: { widgets },
    create: { userId, organizationId: orgId, widgets },
  })

  return NextResponse.json({ widgets: saved.widgets })
}
