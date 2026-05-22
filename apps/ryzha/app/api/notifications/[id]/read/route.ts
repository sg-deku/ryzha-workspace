import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const notification = await prisma.notification.update({
    where: { 
      id: params.id,
      organizationId: session.user.organizationId 
    },
    data: { read: true }
  })

  return NextResponse.json(notification)
}
