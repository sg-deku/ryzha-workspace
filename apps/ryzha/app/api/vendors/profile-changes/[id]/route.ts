import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { action, reviewNote } = await req.json()

  if (!["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "action must be APPROVED or REJECTED" }, { status: 400 })
  }

  const change = await prisma.vendorProfileChange.findFirst({
    where: { id, organizationId: session.user.organizationId },
  })
  if (!change) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (change.status !== "PENDING") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 })
  }

  if (action === "APPROVED") {
    const updates = change.changes as Record<string, any>
    await prisma.vendor.update({
      where: { id: change.vendorId },
      data: updates,
    })
  }

  await prisma.vendorProfileChange.update({
    where: { id },
    data: {
      status: action,
      reviewedAt: new Date(),
      reviewedBy: session.user.name || session.user.email || "Unknown",
      reviewNote: reviewNote || null,
    },
  })

  return NextResponse.json({ success: true })
}
