import { NextRequest, NextResponse } from "next/server"
import { getPortalSession } from "@/lib/vendor-portal/middleware"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const portalSession = await getPortalSession(req)
  if (!portalSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orders = await prisma.purchaseOrder.findMany({
    where: { vendorId: portalSession.vendorId },
    include: {
      lineItems: { select: { description: true, quantity: true, unitPrice: true, amount: true } },
      poAcknowledgments: {
        where: { vendorId: portalSession.vendorId },
        select: { acknowledgedAt: true, note: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const portalSession = await getPortalSession(req)
  if (!portalSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { purchaseOrderId, note } = await req.json()
  if (!purchaseOrderId) return NextResponse.json({ error: "purchaseOrderId required" }, { status: 400 })

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: purchaseOrderId, vendorId: portalSession.vendorId },
  })
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const ack = await prisma.vendorPOAcknowledgment.upsert({
    where: { vendorId_purchaseOrderId: { vendorId: portalSession.vendorId, purchaseOrderId } },
    create: { vendorId: portalSession.vendorId, purchaseOrderId, note: note || null },
    update: { acknowledgedAt: new Date(), note: note || null },
  })

  return NextResponse.json(ack)
}
