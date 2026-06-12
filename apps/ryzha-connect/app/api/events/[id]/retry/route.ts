import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const organizationId = session.user.organizationId

  const event = await prisma.financialEvent.findUnique({
    where: { id },
    select: { id: true, organizationId: true, status: true },
  })

  if (!event || event.organizationId !== organizationId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  if (event.status !== "FAILED") {
    return NextResponse.json({ error: "Only FAILED events can be retried" }, { status: 400 })
  }

  await prisma.financialEvent.update({
    where: { id },
    data: { status: "INGESTED", processedAt: null, pushedAt: null },
  })

  return NextResponse.json({ ok: true, eventId: id, newStatus: "INGESTED" })
}
