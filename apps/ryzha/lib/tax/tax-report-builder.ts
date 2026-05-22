import { prisma } from "@/lib/prisma"

export interface TaxReportFilters {
  orgId: string
  startDate: Date
  endDate: Date
  jurisdiction?: string
  taxRate?: number
}

export async function buildTaxReport(filters: TaxReportFilters) {
  const { orgId, startDate, endDate, jurisdiction, taxRate } = filters

  // 1. Fetch Invoices with filters
  const invoiceWhere: any = { 
    organizationId: orgId, 
    issueDate: { gte: startDate, lte: endDate },
    status: { in: ["PAID", "SENT"] }
  }

  const invoices = await prisma.invoice.findMany({
    where: invoiceWhere,
    include: { lineItems: true }
  })

  // Grouped calculations for invoices
  let totalSales = 0
  let totalTaxCollected = 0
  const salesByRate: Record<number, { sales: number; tax: number }> = {}
  
  const invoiceDetails = invoices.flatMap(inv => {
    // Filter line items if specific tax rate is requested
    const items = taxRate !== undefined 
      ? inv.lineItems.filter(li => li.taxRate === taxRate)
      : inv.lineItems

    // Filter by jurisdiction if requested (checking clientAddress or org-level rules)
    // For MVP, we assume clientAddress stores the jurisdiction code
    const clientJurisdiction = (inv.clientAddress as any)?.country || (inv.clientAddress as any)?.state
    if (jurisdiction && clientJurisdiction !== jurisdiction) return []

    return items.map(li => {
      totalSales += li.amount
      totalTaxCollected += (li.amount * li.taxRate) / 100
      
      if (!salesByRate[li.taxRate]) salesByRate[li.taxRate] = { sales: 0, tax: 0 }
      salesByRate[li.taxRate].sales += li.amount
      salesByRate[li.taxRate].tax += (li.amount * li.taxRate) / 100

      return {
        date: inv.issueDate,
        reference: `${inv.invoiceNumber} (${li.description})`,
        type: "INVOICE",
        amount: li.amount,
        tax: (li.amount * li.taxRate) / 100,
        rate: li.taxRate,
        jurisdiction: clientJurisdiction
      }
    })
  })

  // 2. Fetch Expenses with filters
  const expenseWhere: any = { 
    organizationId: orgId, 
    date: { gte: startDate, lte: endDate }, 
    taxRelevant: true 
  }

  const expenses = await prisma.expense.findMany({
    where: expenseWhere
  })

  let totalDeductibleTax = 0
  const expenseDetails = expenses.flatMap(e => {
    // Simplified 20% for expenses, but could be filtered by jurisdiction/rate if rules existed
    const currentRate = 20 
    if (taxRate !== undefined && currentRate !== taxRate) return []
    
    // Expenses usually don't have jurisdiction stored explicitly in this MVP yet, 
    // but we'll allow filtering if it were there.
    const expenseTax = e.amount * (currentRate / 100)
    totalDeductibleTax += expenseTax

    return [{
      date: e.date,
      reference: e.description,
      type: "EXPENSE",
      amount: e.amount,
      tax: expenseTax,
      rate: currentRate,
      jurisdiction: "N/A"
    }]
  })

  const netOwed = totalTaxCollected - totalDeductibleTax
  const safeHarborWarning = netOwed > 10000 
    ? "Safe harbor: Tax liability exceeds $10,000. It is highly recommended to consult a CPA for estimated tax payments."
    : null

  return { 
    totalSales,
    totalTaxCollected, 
    totalDeductibleTax,
    netOwed,
    salesByRate,
    safeHarborWarning,
    details: [...invoiceDetails, ...expenseDetails].sort((a, b) => b.date.getTime() - a.date.getTime())
  }
}
