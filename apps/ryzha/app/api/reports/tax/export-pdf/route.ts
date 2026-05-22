import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildTaxReport } from "@/lib/tax/tax-report-builder"
import { renderToBuffer } from "@react-pdf/renderer"
import { TaxReportPDF } from "@/lib/pdf/tax-report-pdf"
import React from 'react'

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

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    })

    const buffer = await renderToBuffer(
      React.createElement(TaxReportPDF, {
        report,
        organization,
        startDate,
        endDate
      }) as any
    )

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tax-report-${startDate}-to-${endDate}.pdf"`
      }
    })
  } catch (error: any) {
    console.error("PDF export error:", error)
    return new Response("Failed to export PDF", { status: 500 })
  }
}
