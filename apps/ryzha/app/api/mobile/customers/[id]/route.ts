import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      salesOrders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
      },
    },
  })

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(customer)
}
