import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { exchangePublicToken, getPlaidAccounts, storePlaidConnection } from "@/lib/bank-feeds/plaid-client"
import { syncPlaidAccount } from "@/lib/bank-feeds/plaid-sync"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { publicToken, institutionName, accountName } = await req.json()
    if (!publicToken) return NextResponse.json({ error: "publicToken is required" }, { status: 400 })

    const exchanged = await exchangePublicToken(publicToken)
    const { access_token: accessToken, item_id: itemId } = exchanged

    const accountsData = await getPlaidAccounts(accessToken)
    const firstAccount = accountsData.accounts?.[0]

    const bankAccount = await storePlaidConnection(
      session.user.organizationId,
      accountName || firstAccount?.name || institutionName || "Bank Account",
      {
        accessToken,
        itemId,
        accountId: firstAccount?.account_id ?? "",
        institutionName: institutionName ?? null,
      }
    )

    await syncPlaidAccount(bankAccount.id)

    return NextResponse.json({ bankAccountId: bankAccount.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
