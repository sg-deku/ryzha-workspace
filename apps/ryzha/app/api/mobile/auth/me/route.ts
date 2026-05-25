import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ user: session })
}
