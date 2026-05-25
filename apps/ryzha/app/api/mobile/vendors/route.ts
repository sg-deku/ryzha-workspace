import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const vendors = await prisma.vendor.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      paymentTerms: true,
      status: true,
      createdAt: true,
    },
  })

  return NextResponse.json(vendors)
}
