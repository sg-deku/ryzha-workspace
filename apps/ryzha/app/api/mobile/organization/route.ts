import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: {
      id: true,
      name: true,
      legalName: true,
      taxId: true,
      currency: true,
      defaultTaxRate: true,
      financialSettings: {
        select: { fiscalYearStart: true },
      },
    },
  })

  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    ...org,
    fiscalYearStart: org.financialSettings?.fiscalYearStart ?? "January",
  })
}

export async function PUT(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, legalName, taxId, currency, defaultTaxRate, fiscalYearStart } = body

  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 })

  await prisma.organization.update({
    where: { id: session.organizationId },
    data: {
      name: name.trim(),
      legalName: legalName?.trim() ?? "",
      taxId: taxId?.trim() ?? "",
      currency: currency ?? "USD",
      defaultTaxRate: defaultTaxRate != null ? Number(defaultTaxRate) : undefined,
    },
  })

  if (fiscalYearStart) {
    await prisma.financialSettings.update({
      where: { organizationId: session.organizationId },
      data: { fiscalYearStart },
    })
  }

  return NextResponse.json({ success: true })
}
