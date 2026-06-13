import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""

  if (q.length < 2) return NextResponse.json({ events: [], connections: [] })

  const isNumeric = /^\d+(\.\d+)?$/.test(q)
  const amountCents = isNumeric ? Math.round(parseFloat(q) * 100) : null

  const [events, connections] = await Promise.all([
    prisma.financialEvent.findMany({
      where: {
        organizationId,
        OR: [
          { externalId: { contains: q, mode: "insensitive" } },
          { source: { contains: q, mode: "insensitive" } },
          ...(amountCents !== null ? [{ amount: amountCents }] : []),
          {
            normalisedData: {
              path: ["description"],
              string_contains: q,
            },
          },
          {
            normalisedData: {
              path: ["customerEmail"],
              string_contains: q,
            },
          },
        ],
      },
      select: {
        id: true,
        eventType: true,
        source: true,
        amount: true,
        currency: true,
        status: true,
        externalId: true,
        createdAt: true,
        normalisedData: true,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.integrationConnection.findMany({
      where: {
        organizationId,
        displayName: { contains: q, mode: "insensitive" },
      },
      select: { id: true, provider: true, displayName: true, status: true },
      take: 4,
    }),
  ])

  return NextResponse.json({ events, connections })
}
