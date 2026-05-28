import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const settings = await prisma.numberingSettings.findUnique({
    where: { organizationId: session.user.organizationId },
  })

  return NextResponse.json(settings ?? {})
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const {
    customerPrefix,
    vendorPrefix,
    invoicePrefix,
    soPrefix,
    poPrefix,
    vinvPrefix,
    expensePrefix,
    jePrefix,
    txnPrefix,
    contractPrefix,
    dmPrefix,
    padding,
  } = body

  const data: Record<string, string | number> = {}
  if (customerPrefix !== undefined) data.customerPrefix = String(customerPrefix).toUpperCase()
  if (vendorPrefix !== undefined) data.vendorPrefix = String(vendorPrefix).toUpperCase()
  if (invoicePrefix !== undefined) data.invoicePrefix = String(invoicePrefix).toUpperCase()
  if (soPrefix !== undefined) data.soPrefix = String(soPrefix).toUpperCase()
  if (poPrefix !== undefined) data.poPrefix = String(poPrefix).toUpperCase()
  if (vinvPrefix !== undefined) data.vinvPrefix = String(vinvPrefix).toUpperCase()
  if (expensePrefix !== undefined) data.expensePrefix = String(expensePrefix).toUpperCase()
  if (jePrefix !== undefined) data.jePrefix = String(jePrefix).toUpperCase()
  if (txnPrefix !== undefined) data.txnPrefix = String(txnPrefix).toUpperCase()
  if (contractPrefix !== undefined) data.contractPrefix = String(contractPrefix).toUpperCase()
  if (dmPrefix !== undefined) data.dmPrefix = String(dmPrefix).toUpperCase()
  if (padding !== undefined) data.padding = Math.min(10, Math.max(3, Number(padding)))

  const settings = await prisma.numberingSettings.upsert({
    where: { organizationId: session.user.organizationId },
    create: { organizationId: session.user.organizationId, ...data },
    update: data,
  })

  return NextResponse.json(settings)
}
