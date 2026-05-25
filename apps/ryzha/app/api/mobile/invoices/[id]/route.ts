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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.invoice.findFirst({
    where: { id: params.id, organizationId: session.organizationId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const { status } = body

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: { ...(status ? { status } : {}) },
  })

  return NextResponse.json(updated)
}
