import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const vendor = await prisma.vendor.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, invoiceNumber: true, status: true, amount: true, dueDate: true, createdAt: true },
      },
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, poNumber: true, status: true, totalAmount: true, createdAt: true },
      },
    },
  })

  if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(vendor)
}
