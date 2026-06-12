import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const mappings = await prisma.cOAMapping.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      integrationConnection: { select: { provider: true } },
    },
    orderBy: [{ accountType: "asc" }, { externalCode: "asc" }],
  })

  return NextResponse.json({ mappings })
}

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, ryzhaCategoryHint, isActive } = body

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const mapping = await prisma.cOAMapping.findUnique({
    where: { id },
    select: { organizationId: true },
  })

  if (!mapping || mapping.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const updated = await prisma.cOAMapping.update({
    where: { id },
    data: {
      ...(ryzhaCategoryHint !== undefined ? { ryzhaCategoryHint } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  })

  return NextResponse.json({ mapping: updated })
}
