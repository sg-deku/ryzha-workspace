import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse, after } from "next/server"
import { writeAudit, getClientIp } from "@/lib/audit"

export const dynamic = "force-dynamic"

const CODE_RANGE_TYPE: Record<string, string> = {
  "1": "Assets",
  "2": "Liabilities",
  "3": "Equity",
  "4": "Revenue",
  "5": "Expenses",
}

function validateCodeRange(accountCode: string | null | undefined, accountType: string): string | null {
  if (!accountCode) return null
  const prefix = accountCode.trim().charAt(0)
  const expected = CODE_RANGE_TYPE[prefix]
  if (expected && expected !== accountType) {
    return `Account code ${accountCode} (${prefix}xxx range) must be assigned to a ${expected} account, not ${accountType}.`
  }
  return null
}

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

    const rangeError = validateCodeRange(accountCode, accountType)
    if (rangeError) {
      return NextResponse.json({ error: rangeError }, { status: 400 })
    }

    const account = await prisma.chartOfAccounts.create({
      data: {
        accountCode: accountCode || null,
        accountName,
        accountType,
        categoryMatch: categoryMatch || null,
        parentId: parentId || null,
        isSystem: false,
        organizationId: session.user.organizationId,
      },
    })

    after(
      writeAudit({
        action: "CREATE",
        entityType: "ChartOfAccounts",
        entityId: account.id,
        actorId: session.user.id,
        actorEmail: session.user.email,
        organizationId: session.user.organizationId,
        after: { accountCode, accountName, accountType },
        details: { accountCode, accountName, accountType },
        ipAddress: getClientIp(req),
      }).catch(console.error)
    )

    return NextResponse.json(account, { status: 201 })
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "An account with that name already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: err.message || "Failed to create account" }, { status: 500 })
  }
}
