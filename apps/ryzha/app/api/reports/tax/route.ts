import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { buildTaxReport } from "@/lib/tax/tax-report-builder"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const jurisdiction = searchParams.get("jurisdiction") || undefined
  const taxRate = searchParams.get("taxRate") ? parseFloat(searchParams.get("taxRate")!) : undefined

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Missing date range" }, { status: 400 })
  }

  try {
    const report = await buildTaxReport({
      orgId: session.user.organizationId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      jurisdiction,
      taxRate
    })
    return NextResponse.json(report)
  } catch (error: any) {
    console.error("Report generation error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
