import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const policies = await prisma.policyRule.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: [{ priority: "desc" }, { isActive: "desc" }],
  })

  return NextResponse.json(policies)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, description, type, conditions, action, approverUserId, priority } = body

  if (!name || !type || !action) {
    return NextResponse.json({ error: "name, type and action are required" }, { status: 400 })
  }

  const policy = await prisma.policyRule.create({
    data: {
      organizationId: session.user.organizationId,
      name,
      description: description ?? null,
      type,
      conditions: conditions ?? {},
      action,
      approverUserId: approverUserId ?? null,
      priority: priority ?? 0,
      isActive: true,
    },
  })

  return NextResponse.json(policy, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const policy = await prisma.policyRule.findFirst({
    where: { id, organizationId: session.user.organizationId },
  })
  if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.policyRule.update({
    where: { id },
    data: updates,
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const policy = await prisma.policyRule.findFirst({
    where: { id, organizationId: session.user.organizationId },
  })
  if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.policyRule.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
