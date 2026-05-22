import { prisma } from '@/lib/prisma'
import { buildTaxReport } from '@/lib/tax/tax-report-builder'
import { generateCashFlowForecast } from '@/lib/ai/cashflow-forecast'
import { renderToBuffer } from '@react-pdf/renderer'
import { FinancialDigestPDF } from '@/lib/pdf/financial-digest-pdf'
import React from 'react'

export async function processWeeklyReports() {
  const schedules = await prisma.reportSchedule.findMany({
    where: { 
      active: true,
      frequency: 'WEEKLY'
    },
    include: { organization: true }
  })

  for (const schedule of schedules) {
    try {
      const data = await gatherReportData(schedule.organizationId)
      const pdfBuffer = await renderToBuffer(
        React.createElement(FinancialDigestPDF, { 
          data, 
          organization: schedule.organization,
          period: 'Weekly Digest'
        })
      )

      // Mock email sending
      console.log(`Sending report to ${schedule.recipients.join(', ')} for ${schedule.organization.name}`)
      // await sendEmailWithAttachment(schedule.recipients, pdfBuffer)
    } catch (error) {
      console.error(`Failed to process report for ${schedule.organizationId}:`, error)
    }
  }
}

async function gatherReportData(orgId: string) {
  const now = new Date()
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const tax = await buildTaxReport({
    orgId,
    startDate: lastWeek,
    endDate: now
  })
  const forecast = await generateCashFlowForecast({ 
    organizationId: orgId, 
    currentBalance: 50000 
  })
  
  const pendingInvoices = await prisma.invoice.findMany({
    where: { organizationId: orgId, status: 'DRAFT' }, // Simplified for MVP
    take: 5
  })

  return {
    currentBalance: 50000, // Mock or fetch from integrations
    unpaidAmount: pendingInvoices.reduce((sum, i) => sum + i.total, 0),
    netTax: tax.netOwed,
    forecastInsight: forecast.insights?.[0] || "No major insights this week.",
    pendingInvoices
  }
}
