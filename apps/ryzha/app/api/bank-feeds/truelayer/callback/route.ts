import { NextResponse } from "next/server"
import { exchangeCode, getTrueLayerAccounts, storeTrueLayerConnection } from "@/lib/bank-feeds/truelayer-client"
import { syncTrueLayerAccount } from "@/lib/bank-feeds/truelayer-sync"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const orgId = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(new URL(`/settings/integrations/truelayer?error=${encodeURIComponent(error)}`, req.url))
  }

  if (!code || !orgId) {
    return NextResponse.redirect(new URL("/settings/integrations/truelayer?error=missing_params", req.url))
  }

  try {
    const tokens = await exchangeCode(code)
    const accounts = await getTrueLayerAccounts(tokens.access_token)
    const firstAccount = accounts[0]

    if (!firstAccount) throw new Error("No accounts returned from TrueLayer")

    const bankAccount = await storeTrueLayerConnection(
      orgId,
      firstAccount.display_name ?? firstAccount.account_id,
      tokens,
      firstAccount.account_id,
      firstAccount.provider?.display_name ?? undefined
    )

    await syncTrueLayerAccount(bankAccount.id)

    return NextResponse.redirect(new URL("/settings/integrations/truelayer?connected=1", req.url))
  } catch (err: any) {
    return NextResponse.redirect(new URL(`/settings/integrations/truelayer?error=${encodeURIComponent(err.message)}`, req.url))
  }
}
