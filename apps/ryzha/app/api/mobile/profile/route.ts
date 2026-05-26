import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function PATCH(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name } = body

  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 })

  const user = await prisma.user.update({
    where: { id: session.id },
    data: { name: name.trim() },
    select: { id: true, name: true, email: true },
  })

  return NextResponse.json(user)
}

export async function GET(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      organizations: {
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
        },
        take: 1,
      },
    },
  })

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    ...user,
    organization: user.organizations[0]?.organization ?? null,
  })
}
