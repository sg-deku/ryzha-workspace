import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  try {
    const body = await req.json()
    const { accountCode, accountName, accountType, categoryMatch, parentId } = body

    const existing = await prisma.chartOfAccounts.findFirst({
      where: { id, organizationId: session.user.organizationId },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const account = await prisma.chartOfAccounts.update({
      where: { id },
      data: {
        accountCode: accountCode ?? existing.accountCode,
        accountName: accountName ?? existing.accountName,
        accountType: accountType ?? existing.accountType,
        categoryMatch: categoryMatch ?? existing.categoryMatch,
        parentId: parentId === "" ? null : (parentId ?? existing.parentId),
      },
    })

    return NextResponse.json(account)
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "An account with that name already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: err.message || "Failed to update account" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const existing = await prisma.chartOfAccounts.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { children: { select: { id: true } } },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (existing.children.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete an account that has sub-accounts. Remove the sub-accounts first." },
      { status: 400 }
    )
  }

  await prisma.chartOfAccounts.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
