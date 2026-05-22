import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  let settings = await prisma.financialSettings.findUnique({ 
    where: { organizationId: session.user.organizationId } 
  })
  
  if (!settings) {
    settings = await prisma.financialSettings.create({ 
      data: { 
        organizationId: session.user.organizationId,
        deferredRevenueRules: ["annual", "yearly", "subscription"]
      } 
    })
  }
  
  return NextResponse.json(settings)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, organizationId, ...updateData } = body

  try {
    const updated = await prisma.financialSettings.upsert({
      where: { organizationId: session.user.organizationId },
      update: updateData,
      create: {
        deferredRevenueRules: ["annual", "yearly", "subscription"],
        ...updateData,
        organizationId: session.user.organizationId,
      },
    })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error("[settings/financial PUT]", err)
    return NextResponse.json({ error: err.message || "Failed to save settings" }, { status: 500 })
  }
}
