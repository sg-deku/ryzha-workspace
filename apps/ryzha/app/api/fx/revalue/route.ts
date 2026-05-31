import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revaluateOpenItems } from "@/lib/fx/fx-engine"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const result = await revaluateOpenItems(session.user.organizationId)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
