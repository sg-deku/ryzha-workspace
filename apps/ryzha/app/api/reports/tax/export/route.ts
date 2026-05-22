import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { buildTaxReport } from "@/lib/tax/tax-report-builder"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const jurisdiction = searchParams.get("jurisdiction") || undefined
  const taxRate = searchParams.get("taxRate") ? parseFloat(searchParams.get("taxRate")!) : undefined

  if (!startDate || !endDate) {
    return new Response("Missing date range", { status: 400 })
  }

  try {
    const report = await buildTaxReport({
      orgId: session.user.organizationId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      jurisdiction,
      taxRate
    })

    // Generate CSV
    const headers = ["Date", "Reference", "Type", "Jurisdiction", "Rate %", "Amount", "Tax"]
    const rows = report.details.map(d => [
      new Date(d.date).toLocaleDateString(),
      d.reference,
      d.type,
      d.jurisdiction,
      d.rate,
      d.amount.toFixed(2),
      d.tax.toFixed(2)
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tax-report-${startDate}-to-${endDate}.csv"`
      }
    })
  } catch (error: any) {
    console.error("CSV export error:", error)
    return new Response("Failed to export CSV", { status: 500 })
  }
}
