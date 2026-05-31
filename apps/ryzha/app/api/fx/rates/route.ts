import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getOrFetchRate } from "@/lib/fx/fx-engine"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  if (from && to) {
    const { rate, source } = await getOrFetchRate(
      session.user.organizationId,
      from.toUpperCase(),
      to.toUpperCase()
    )
    return NextResponse.json({ from: from.toUpperCase(), to: to.toUpperCase(), rate, source, date: new Date().toISOString().slice(0, 10) })
  }

  const rates = await prisma.exchangeRate.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { rateDate: "desc" },
    take: 200,
  })
  return NextResponse.json(rates)
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { fromCurrency, toCurrency, rate, rateDate } = await req.json()
    if (!fromCurrency || !toCurrency || !rate) {
      return NextResponse.json({ error: "fromCurrency, toCurrency, rate required" }, { status: 400 })
    }

    const date = rateDate ? new Date(rateDate) : new Date()
    const dayStart = new Date(date.toISOString().slice(0, 10))

    const created = await prisma.exchangeRate.upsert({
      where: {
        organizationId_fromCurrency_toCurrency_rateDate: {
          organizationId: session.user.organizationId,
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
          rateDate: dayStart,
        },
      },
      create: {
        id: crypto.randomUUID(),
        organizationId: session.user.organizationId,
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        rate: Number(rate),
        source: "MANUAL",
        rateDate: dayStart,
      },
      update: { rate: Number(rate), source: "MANUAL" },
    })

    return NextResponse.json(created)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
