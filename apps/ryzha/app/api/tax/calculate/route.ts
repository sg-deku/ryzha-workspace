import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { calculateTax } from "@/lib/tax/tax-engine"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { amount, productCategory, customerCountry, isB2B, customerState } = await req.json()
    
    if (!amount || !productCategory || !customerCountry) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await calculateTax(
      parseFloat(amount),
      productCategory,
      customerCountry,
      session.user.organizationId,
      isB2B,
      customerState
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Tax calculation error:", error)
    return NextResponse.json({ error: error.message || "Failed to calculate tax" }, { status: 500 })
  }
}
