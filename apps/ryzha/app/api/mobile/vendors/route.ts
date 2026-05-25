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

export async function POST(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, email, phone, paymentTerms } = body

  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 })

  const vendor = await prisma.vendor.create({
    data: {
      organizationId: session.organizationId,
      name: name.trim(),
      email: email?.trim() ?? "",
      phone: phone?.trim() ?? "",
      paymentTerms: paymentTerms ?? "NET30",
      status: "ACTIVE",
    },
  })

  return NextResponse.json(vendor, { status: 201 })
}
