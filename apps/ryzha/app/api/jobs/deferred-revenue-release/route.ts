import { NextResponse } from "next/server"
import { releaseDeferredRevenue } from "@/lib/jobs/deferred-revenue-release"

export async function POST() {
  try {
    const result = await releaseDeferredRevenue()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Failed to release deferred revenue:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
