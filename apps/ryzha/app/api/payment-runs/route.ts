import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse, after } from "next/server"
import { getNextEntityNumber } from "@/lib/sequences"
import { writeAudit, getClientIp } from "@/lib/audit"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const runs = await prisma.paymentRun.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      items: { select: { id: true, amount: true, status: true } },
      bankAccount: { select: { id: true, name: true, currency: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json(runs)
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, paymentDate, currency, format, bankAccountId, notes } = await req.json()

    if (!name || !paymentDate) {
      return NextResponse.json({ error: "name and paymentDate are required" }, { status: 400 })
    }

    const runNumber = await getNextEntityNumber(session.user.organizationId, "PRUN")

    const run = await prisma.paymentRun.create({
      data: {
        runNumber,
        name,
        paymentDate: new Date(paymentDate),
        currency: (currency ?? "USD").toUpperCase(),
        format: format ?? "MANUAL",
        bankAccountId: bankAccountId ?? null,
        notes: notes ?? null,
        createdById: session.user.id,
        organizationId: session.user.organizationId,
      },
    })

    after(
      writeAudit({
        action: "CREATE",
        entityType: "PaymentRun",
        entityId: run.id,
        actorId: session.user.id,
        actorEmail: session.user.email,
        organizationId: session.user.organizationId,
        after: { runNumber, name, paymentDate: run.paymentDate, currency: run.currency, format: run.format },
        details: { runNumber, name },
        ipAddress: getClientIp(req),
      }).catch(console.error)
    )

    return NextResponse.json(run, { status: 201 })
  } catch (err: any) {
    console.error("Error creating payment run:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
