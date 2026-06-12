import axios from "axios"
import type { NormalisedFinancialEvent } from "../types"

const GUSTO_API = "https://api.gusto.com/v1"

export async function pullGustoPayrolls(
  accessToken: string,
  companyId: string,
  options: { daysSince?: number } = {}
): Promise<NormalisedFinancialEvent[]> {
  const { daysSince = 90 } = options
  const startDate = new Date(Date.now() - daysSince * 86400 * 1000).toISOString().split("T")[0]

  const client = axios.create({
    baseURL: GUSTO_API,
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const { data } = await client.get(`/companies/${companyId}/payrolls`, {
    params: { start_date: startDate, processed: true },
  })

  const payrolls: any[] = data ?? []
  const results: NormalisedFinancialEvent[] = []

  for (const payroll of payrolls) {
    const gross = parseFloat(payroll.totals?.gross_pay ?? "0")
    const net = parseFloat(payroll.totals?.net_pay ?? "0")
    const taxes = parseFloat(payroll.totals?.employee_taxes ?? "0") + parseFloat(payroll.totals?.employer_taxes ?? "0")

    results.push({
      source: "gusto",
      externalId: String(payroll.payroll_uuid ?? payroll.id),
      eventType: "PAYROLL_PROCESSED",
      amount: gross,
      currency: "USD",
      rawPayload: payroll,
      normalisedData: {
        payPeriodStart: payroll.pay_period?.start_date ?? null,
        payPeriodEnd: payroll.pay_period?.end_date ?? null,
        checkDate: payroll.check_date ?? null,
        grossPay: gross,
        netPay: net,
        totalTaxes: taxes,
        employeeCount: payroll.employee_compensations?.length ?? 0,
        processed: payroll.processed,
      },
    })
  }

  return results
}

export async function pullGustoEmployees(accessToken: string, companyId: string) {
  const client = axios.create({
    baseURL: GUSTO_API,
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const { data } = await client.get(`/companies/${companyId}/employees`, {
    params: { include: "jobs,custom_fields" },
  })

  return (data ?? []).map((e: any) => ({
    id: e.uuid,
    name: `${e.first_name} ${e.last_name}`,
    department: e.jobs?.[0]?.title ?? null,
    startDate: e.start_date ?? null,
    salary: parseFloat(e.jobs?.[0]?.compensations?.[0]?.rate ?? "0"),
  }))
}
