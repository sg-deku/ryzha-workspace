import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const accounts = await prisma.chartOfAccounts.findMany({
    where: { organizationId: session.user.organizationId },
    include: { children: { select: { id: true, accountCode: true, accountName: true, accountType: true } } },
    orderBy: [{ accountType: "asc" }, { accountCode: "asc" }, { accountName: "asc" }],
  })

  return NextResponse.json(accounts)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { accountCode, accountName, accountType, categoryMatch, parentId } = body

    if (!accountName || !accountType) {
      return NextResponse.json({ error: "accountName and accountType are required" }, { status: 400 })
    }

    const account = await prisma.chartOfAccounts.create({
      data: {
        accountCode: accountCode || null,
        accountName,
        accountType,
        categoryMatch: categoryMatch || null,
        parentId: parentId || null,
        organizationId: session.user.organizationId,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "An account with that name already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: err.message || "Failed to create account" }, { status: 500 })
  }
}
