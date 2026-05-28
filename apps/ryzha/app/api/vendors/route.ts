import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getNextEntityNumber } from "@/lib/sequences"

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vendors = await prisma.vendor.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: "asc" }
    })

    return NextResponse.json(vendors)
  } catch (error) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, taxId, paymentTerms, status, address } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const vendorNumber = await getNextEntityNumber(session.user.organizationId, "VENDOR")

    const vendor = await prisma.vendor.create({
      data: {
        vendorNumber,
        name,
        email: email || null,
        taxId: taxId || null,
        paymentTerms: paymentTerms || "NET30",
        status: status || "ACTIVE",
        address: address ?? undefined,
        organizationId: session.user.organizationId,
      },
    })

    return NextResponse.json(vendor)
  } catch (error) {
    console.error("Error creating vendor:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
