import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 20

  const invoices = await prisma.vendorInvoice.findMany({
    where: {
      organizationId: session.organizationId,
      ...(status ? { status } : {}),
    },
    include: { vendor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  })

  return NextResponse.json(invoices)
}
