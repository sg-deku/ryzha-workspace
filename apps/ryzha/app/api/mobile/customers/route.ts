import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const customers = await prisma.customer.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      taxId: true,
      status: true,
      creditLimit: true,
      createdAt: true,
    },
  })

  return NextResponse.json(customers)
}

export async function POST(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, email, phone, taxId, creditLimit } = body

  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 })

  const customer = await prisma.customer.create({
    data: {
      organizationId: session.organizationId,
      name: name.trim(),
      email: email?.trim() ?? "",
      phone: phone?.trim() ?? "",
      taxId: taxId?.trim() ?? "",
      creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
      status: "ACTIVE",
    },
  })

  return NextResponse.json(customer, { status: 201 })
}
