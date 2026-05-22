import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { recipients, frequency, reportType } = await req.json()

  const existing = await prisma.reportSchedule.findFirst({
    where: { organizationId: session.user.organizationId }
  })

  let schedule;
  if (existing) {
    schedule = await prisma.reportSchedule.update({
      where: { id: existing.id },
      data: {
        recipients,
        frequency,
        type: reportType
      }
    })
  } else {
    schedule = await prisma.reportSchedule.create({
      data: {
        organizationId: session.user.organizationId,
        recipients,
        frequency,
        type: reportType
      }
    })
  }

  return NextResponse.json(schedule)
}
