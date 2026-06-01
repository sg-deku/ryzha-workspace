import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse, after } from "next/server"
import { writeAudit, getClientIp } from "@/lib/audit"

export const dynamic = "force-dynamic"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  try {
    const existing = await prisma.chartOfAccounts.findFirst({
      where: { id, organizationId: session.user.organizationId },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (existing.isSystem) {
      return NextResponse.json(
        { error: "System accounts are locked and cannot be modified. They are managed by Ryzha." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { accountName, categoryMatch, parentId } = body

    const account = await prisma.chartOfAccounts.update({
      where: { id },
      data: {
        accountName: accountName ?? existing.accountName,
        categoryMatch: categoryMatch ?? existing.categoryMatch,
        parentId: parentId === "" ? null : (parentId ?? existing.parentId),
      },
    })

    after(
      writeAudit({
        action: "UPDATE",
        entityType: "ChartOfAccounts",
        entityId: id,
        actorId: session.user.id,
        actorEmail: session.user.email,
        organizationId: session.user.organizationId,
        before: { accountName: existing.accountName, categoryMatch: existing.categoryMatch, parentId: existing.parentId },
        after: { accountName: account.accountName, categoryMatch: account.categoryMatch, parentId: account.parentId },
        details: { accountCode: existing.accountCode, accountType: existing.accountType },
        ipAddress: getClientIp(req),
      }).catch(console.error)
    )

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

  if (existing.isSystem) {
    return NextResponse.json(
      { error: "System accounts cannot be deleted. They are required for financial operations." },
      { status: 403 }
    )
  }

  if (existing.children.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete an account that has sub-accounts. Remove the sub-accounts first." },
      { status: 400 }
    )
  }

  await prisma.chartOfAccounts.delete({ where: { id } })

  after(
    writeAudit({
      action: "DELETE",
      entityType: "ChartOfAccounts",
      entityId: id,
      actorId: session.user.id,
      actorEmail: session.user.email,
      organizationId: session.user.organizationId,
      before: { accountCode: existing.accountCode, accountName: existing.accountName, accountType: existing.accountType },
      details: { accountCode: existing.accountCode, accountName: existing.accountName },
      ipAddress: getClientIp(_req),
    }).catch(console.error)
  )

  return NextResponse.json({ success: true })
}
