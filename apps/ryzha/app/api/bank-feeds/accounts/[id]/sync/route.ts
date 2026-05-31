import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { syncPlaidAccount } from "@/lib/bank-feeds/plaid-sync"
import { syncTrueLayerAccount } from "@/lib/bank-feeds/truelayer-sync"

export const dynamic = "force-dynamic"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const account = await prisma.bankAccount.findFirst({
    where: { id: params.id, organizationId: session.user.organizationId },
    select: { id: true, connectionType: true },
  })

  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 })

  try {
    let result
    if (account.connectionType === "PLAID") {
      result = await syncPlaidAccount(account.id)
    } else if (account.connectionType === "TRUELAYER") {
      result = await syncTrueLayerAccount(account.id)
    } else {
      return NextResponse.json({ error: "Manual accounts cannot be synced via API" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
