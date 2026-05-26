import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgId = session.user.organizationId

  const snapshot = await prisma.financialSnapshot.findUnique({
    where: { organizationId: orgId },
    select: { bankBalance: true },
  })

  if (snapshot) {
    return NextResponse.json({ balance: snapshot.bankBalance })
  }

  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId: orgId },
    select: { bankBalance: true },
  })

  return NextResponse.json({ balance: settings?.bankBalance ?? 0 })
}
