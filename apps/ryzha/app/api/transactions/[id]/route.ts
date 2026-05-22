import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id, organizationId: session.user.organizationId },
    include: {
      organization: true
    }
  })

  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(transaction)
}