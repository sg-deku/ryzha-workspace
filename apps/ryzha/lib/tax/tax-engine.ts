import { prisma } from "@/lib/prisma"

export async function calculateTax(
  amount: number, 
  productCategory: string, 
  customerCountry: string, 
  organizationId: string,
  isB2B: boolean = false,
  customerState?: string
) {
  const allRules = await prisma.taxRule.findMany({
    where: { organizationId }
  })

  const euCountries = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PO", "PT", "RO", "SE", "SI", "SK"]

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { address: true }
  })
  const orgCountry = (organization?.address as any)?.country

  if (isB2B && euCountries.includes(customerCountry) && customerCountry !== orgCountry) {
    return { 
      taxRate: 0, 
      taxAmount: 0, 
      ruleApplied: { name: "VAT Reverse Charge" },
      isReverseCharge: true 
    }
  }

  if (customerCountry === "US" && customerState) {
    const nexusRule = allRules.find(r => 
      r.jurisdiction === customerState && 
      r.isNexus && 
      r.taxType === "SALES_TAX" &&
      r.appliesTo.includes(productCategory)
    )
    if (nexusRule) {
      const taxAmount = amount * nexusRule.rate
      return { taxRate: nexusRule.rate, taxAmount, ruleApplied: nexusRule }
    }
  }

  const rule = allRules.find(r => 
    r.jurisdiction === customerCountry && 
    r.appliesTo.includes(productCategory)
  )

  if (!rule) return { taxRate: 0, taxAmount: 0, ruleApplied: null }
  
  const taxAmount = amount * rule.rate
  return { taxRate: rule.rate, taxAmount, ruleApplied: rule }
}
