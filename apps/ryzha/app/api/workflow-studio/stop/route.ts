import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { executionId } = await req.json()
  
  // Logic to stop workflow - usually updates status to CANCELLED in DB
  return NextResponse.json({ success: true, message: `Stopped workflow ${executionId}` })
}
