import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await hasPermission("settings:manage"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await req.json()
    const { name, legalName, taxId, currency, defaultTaxRate, fiscalYearStart } = data

    // Update organization
    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        name,
        legalName,
        taxId,
        currency,
        defaultTaxRate,
      },
    })

    // Also update fiscalYearStart in FinancialSettings
    await prisma.financialSettings.update({
      where: { organizationId: session.user.organizationId },
      data: {
        fiscalYearStart,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update organization settings", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}