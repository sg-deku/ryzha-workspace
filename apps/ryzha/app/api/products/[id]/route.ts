import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const product = await prisma.product.findUnique({
    where: { id, organizationId: session.user.organizationId },
  })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const product = await prisma.product.findUnique({
    where: { id, organizationId: session.user.organizationId },
  })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const { name, description, unitPrice, costPrice, taxRate, accountCode, type, isActive } = body

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: name ?? product.name,
      description: description !== undefined ? description : product.description,
      unitPrice: unitPrice != null ? parseFloat(unitPrice) : product.unitPrice,
      costPrice: costPrice != null ? parseFloat(costPrice) : product.costPrice,
      taxRate: taxRate != null ? parseFloat(taxRate) : product.taxRate,
      accountCode: accountCode !== undefined ? accountCode : product.accountCode,
      type: type ?? product.type,
      isActive: isActive !== undefined ? isActive : product.isActive,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const product = await prisma.product.findUnique({
    where: { id, organizationId: session.user.organizationId },
    include: {
      _count: {
        select: { invoiceLines: true, salesOrderLines: true, purchaseOrderLines: true, vendorInvoiceLines: true },
      },
    },
  })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const usageCount = product._count.invoiceLines + product._count.salesOrderLines +
    product._count.purchaseOrderLines + product._count.vendorInvoiceLines

  if (usageCount > 0) {
    await prisma.product.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ archived: true, message: "Product has been used on documents — it has been archived instead of deleted." })
  }

  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
