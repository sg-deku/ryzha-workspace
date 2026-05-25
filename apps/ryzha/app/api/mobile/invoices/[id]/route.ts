import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, organizationId: session.organizationId },
    include: { lineItems: true },
  })

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(invoice)
}
