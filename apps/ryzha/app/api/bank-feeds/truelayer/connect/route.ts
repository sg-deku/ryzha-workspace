import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getAuthorizationUrl } from "@/lib/bank-feeds/truelayer-client"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = getAuthorizationUrl(session.user.organizationId)
  return NextResponse.json({ url })
}
