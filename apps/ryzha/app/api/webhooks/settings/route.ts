import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import crypto from "crypto"

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const webhooks = await prisma.webhook.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(webhooks)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { url, events } = await req.json()
    
    if (!url || !events || events.length === 0) {
      return NextResponse.json({ error: "Missing URL or events" }, { status: 400 })
    }

    const webhook = await prisma.webhook.create({
      data: {
        url,
        events,
        secret: `whsec_${crypto.randomBytes(24).toString("hex")}`,
        organizationId: session.user.organizationId
      }
    })

    return NextResponse.json(webhook)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  await prisma.webhook.delete({ where: { id, organizationId: session.user.organizationId } })
  return NextResponse.json({ success: true })
}
