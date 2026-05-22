import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, email, taxId, paymentTerms } = await req.json()

    const existing = await prisma.vendor.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        name,
        email,
        taxId,
        paymentTerms
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update vendor:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
