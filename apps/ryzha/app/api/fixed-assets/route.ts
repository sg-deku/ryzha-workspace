import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getNextEntityNumber } from "@/lib/sequences"
import { generateDepreciationSchedule } from "@/lib/fixed-assets/depreciation-engine"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const assets = await prisma.fixedAsset.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { acquisitionDate: "desc" },
    include: { vendor: { select: { id: true, name: true } } },
  })

  return NextResponse.json(assets)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const {
      name, description, category, acquisitionDate, acquisitionCost, salvageValue,
      usefulLifeMonths, depreciationMethod, glAssetAccount, glDepreciationAccount,
      glAccumulatedAccount, vendorId, purchaseOrderId, tags,
    } = body

    if (!name || !acquisitionDate || !acquisitionCost || !usefulLifeMonths) {
      return NextResponse.json({ error: "name, acquisitionDate, acquisitionCost, and usefulLifeMonths are required" }, { status: 400 })
    }

    const assetNumber = await getNextEntityNumber(session.user.organizationId, "FA")
    const cost = Number(acquisitionCost)

    const asset = await prisma.fixedAsset.create({
      data: {
        organizationId: session.user.organizationId,
        assetNumber,
        name,
        description: description ?? null,
        category: category ?? "Equipment",
        acquisitionDate: new Date(acquisitionDate),
        acquisitionCost: cost,
        salvageValue: Number(salvageValue ?? 0),
        usefulLifeMonths: Number(usefulLifeMonths),
        depreciationMethod: depreciationMethod ?? "STRAIGHT_LINE",
        currentBookValue: cost,
        accumulatedDepreciation: 0,
        status: "ACTIVE",
        glAssetAccount: glAssetAccount ?? "Fixed Assets",
        glDepreciationAccount: glDepreciationAccount ?? "Depreciation Expense",
        glAccumulatedAccount: glAccumulatedAccount ?? "Accumulated Depreciation",
        vendorId: vendorId ?? null,
        purchaseOrderId: purchaseOrderId ?? null,
        tags: tags ?? null,
      },
    })

    await generateDepreciationSchedule(asset.id)

    return NextResponse.json(asset)
  } catch (err: any) {
    console.error("[fixed-assets POST]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
