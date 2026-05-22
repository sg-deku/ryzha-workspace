import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const body = await req.json()
  const { legalName, address, taxId, defaultTaxRate, currency, taxRules } = body
  const organizationId = session.user.organizationId

  try {
    await prisma.$transaction(async (tx) => {
      // Update Organization
      await tx.organization.update({
        where: { id: organizationId },
        data: {
          legalName,
          address,
          taxId,
          defaultTaxRate,
          currency,
          onboardingCompleted: true
        }
      })

      // Create tax rules
      if (taxRules && taxRules.length > 0) {
        await tx.taxRule.createMany({
          data: taxRules.map((rule: any) => ({
            name: rule.name,
            jurisdiction: rule.jurisdiction,
            rate: rule.rate,
            appliesTo: rule.appliesTo || [],
            organizationId: organizationId
          }))
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Onboarding completion error:", error)
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 })
  }
}
