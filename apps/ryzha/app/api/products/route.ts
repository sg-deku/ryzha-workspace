import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const activeOnly = searchParams.get("active") !== "false"
  const scope = searchParams.get("scope")

  const products = await prisma.product.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(activeOnly ? { isActive: true } : {}),
      ...(type ? { type } : {}),
      ...(scope === "sales" ? { usedInSales: true, type: { not: "tax" } } : {}),
      ...(scope === "purchasing" ? { usedInPurchasing: true, type: { not: "tax" } } : {}),
    },
    orderBy: { code: "asc" },
  })

  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { code, name, description, unitPrice, costPrice, taxRate, accountCode, type, usedInSales, usedInPurchasing } = body

  if (!code || !name) {
    return NextResponse.json({ error: "code and name are required" }, { status: 400 })
  }

  const existing = await prisma.product.findUnique({
    where: { organizationId_code: { organizationId: session.user.organizationId, code } },
  })
  if (existing) {
    return NextResponse.json({ error: `Product code "${code}" already exists` }, { status: 409 })
  }

  const product = await prisma.product.create({
    data: {
      code,
      name,
      description: description || null,
      unitPrice: parseFloat(unitPrice) || 0,
      costPrice: costPrice != null ? parseFloat(costPrice) : null,
      taxRate: parseFloat(taxRate) || 0,
      accountCode: accountCode || null,
      type: type || "service",
      usedInSales: usedInSales !== false,
      usedInPurchasing: usedInPurchasing !== false,
      organizationId: session.user.organizationId,
    },
  })

  return NextResponse.json(product, { status: 201 })
}
