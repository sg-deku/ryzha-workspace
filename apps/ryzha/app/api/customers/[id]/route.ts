import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const data = await req.json()
    const { name, email, phone, taxId, creditLimit, paymentTerms, status, notes, address } = data

    const updated = await prisma.customer.update({
      where: {
        id,
        organizationId: session.user.organizationId
      },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        taxId: taxId || null,
        creditLimit: Number(creditLimit),
        paymentTerms: paymentTerms || "NET30",
        status,
        notes: notes || null,
        address: address ?? undefined,
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update customer", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId
      }
    })

    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
