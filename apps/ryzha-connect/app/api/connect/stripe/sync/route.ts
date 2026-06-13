import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { runStripeSync } from "@/lib/stripe-sync"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const daysSince = parseInt(req.nextUrl.searchParams.get("daysSince") ?? "90", 10)

  try {
    const result = await runStripeSync(session.user.organizationId, daysSince)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const daysSince: number = body.daysSince ?? 90

  try {
    const result = await runStripeSync(session.user.organizationId, daysSince)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
