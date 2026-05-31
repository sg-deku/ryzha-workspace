import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const vendor = await prisma.vendor.findUnique({
    where: { id, organizationId: session.user.organizationId },
  })
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
  return NextResponse.json(vendor)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const {
      name, email, taxId, paymentTerms, status, address,
      bankAccountName, bankIban, bankBic, bankRoutingNumber,
      bankAccountNumber, bankSortCode, bankCountry,
    } = await req.json()

    const existing = await prisma.vendor.findUnique({
      where: { id, organizationId: session.user.organizationId },
    })
    if (!existing) return NextResponse.json({ error: "Vendor not found" }, { status: 404 })

    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        name,
        email: email || null,
        taxId: taxId || null,
        paymentTerms: paymentTerms || "NET30",
        status: status || "ACTIVE",
        address: address ?? undefined,
        bankAccountName: bankAccountName ?? undefined,
        bankIban: bankIban ?? undefined,
        bankBic: bankBic ?? undefined,
        bankRoutingNumber: bankRoutingNumber ?? undefined,
        bankAccountNumber: bankAccountNumber ?? undefined,
        bankSortCode: bankSortCode ?? undefined,
        bankCountry: bankCountry ?? undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update vendor:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
