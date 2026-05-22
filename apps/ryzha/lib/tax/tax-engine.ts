import { prisma } from "@/lib/prisma"

// Simple in-memory cache for tax rules
interface CacheEntry {
  rules: any[]
  timestamp: number
}

const cache: Record<string, CacheEntry> = {}
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

async function getCachedTaxRules(organizationId: string) {
  const now = Date.now()
  if (cache[organizationId] && (now - cache[organizationId].timestamp) < CACHE_TTL) {
    return cache[organizationId].rules
  }

  const rules = await prisma.taxRule.findMany({
    where: { organizationId }
  })

  cache[organizationId] = {
    rules,
    timestamp: now
  }

  return rules
}

export async function calculateTax(
  amount: number, 
  productCategory: string, 
  customerCountry: string, 
  organizationId: string,
  isB2B: boolean = false,
  customerState?: string // For US Sales Tax
) {
  const allRules = await getCachedTaxRules(organizationId)
  
  // 1. VAT Reverse Charge Detection (B2B EU)
  // Simple check: if customer is in EU, is B2B, and different from org country
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

  // 2. US Sales Tax Nexus Tracking
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

  // 3. Standard Tax Resolution
  const rule = allRules.find(r => 
    r.jurisdiction === customerCountry && 
    r.appliesTo.includes(productCategory)
  )

  if (!rule) return { taxRate: 0, taxAmount: 0, ruleApplied: null }
  
  const taxAmount = amount * rule.rate
  return { taxRate: rule.rate, taxAmount, ruleApplied: rule }
}
