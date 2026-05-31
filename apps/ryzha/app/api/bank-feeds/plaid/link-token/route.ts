import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { createLinkToken } from "@/lib/bank-feeds/plaid-client"

export const dynamic = "force-dynamic"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const data = await createLinkToken(session.user.id, session.user.organizationId)
    return NextResponse.json({ linkToken: data.link_token })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
