import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function getPrefix(type: string, usedInSales: boolean, usedInPurchasing: boolean): string {
  if (type === "tax") return "TAX"
  if (usedInSales && usedInPurchasing) return type === "product" ? "ITEM" : "SVC"
  if (usedInSales) return type === "product" ? "ITEM" : "SVC"
  if (usedInPurchasing) return type === "product" ? "COGS" : "EXP"
  return "ITEM"
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") ?? "service"
  const usedInSales = searchParams.get("usedInSales") !== "false"
  const usedInPurchasing = searchParams.get("usedInPurchasing") !== "false"

  const prefix = getPrefix(type, usedInSales, usedInPurchasing)
  const orgId = session.user.organizationId

  const existing = await prisma.product.findMany({
    where: {
      organizationId: orgId,
      code: { startsWith: prefix + "-" },
    },
    select: { code: true },
  })

  const usedNumbers = existing
    .map(p => parseInt(p.code.replace(prefix + "-", ""), 10))
    .filter(n => !isNaN(n))

  const next = usedNumbers.length === 0 ? 1 : Math.max(...usedNumbers) + 1
  const code = `${prefix}-${String(next).padStart(4, "0")}`

  return NextResponse.json({ code, prefix })
}
