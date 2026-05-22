import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateCashFlowForecast } from "@/lib/ai/cashflow-forecast"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { currentBalance, whatIfScenarios } = await req.json()
    
    // Default balance if not provided
    const balance = currentBalance || 10000

    const forecast = await generateCashFlowForecast({
      organizationId: session.user.organizationId,
      currentBalance: balance,
      whatIfScenarios
    })

    return NextResponse.json(forecast)
  } catch (error: any) {
    console.error("Forecast error:", error)
    return NextResponse.json({ error: "Failed to generate forecast" }, { status: 500 })
  }
}
